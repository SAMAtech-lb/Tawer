/* Neon Postgres storage for the site content, its version history, the form requests and login rate limiting.
 * Needs DATABASE_URL (Neon connection string) in .env. Tables are created automatically on the first write. */
import { neon } from "@neondatabase/serverless";

export const MAX_HISTORY = 10;
export const LOGIN_MAX_FAILS = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;
/* Site-wide cap on wrong passwords (all visitors together), so faking a new IP for every guess doesn't help. */
export const LOGIN_MAX_FAILS_ALL = 30;
const ALL = "*";   // the login_failures row that counts every wrong password

export const hasDb = () => !!process.env.DATABASE_URL;

let sqlClient;
const sql = () => {
  if (!hasDb()) throw new Error("The database isn't configured (DATABASE_URL).");
  return (sqlClient ??= neon(process.env.DATABASE_URL));
};

let schemaReady;
const ensureSchema = () =>
  (schemaReady ??= (async () => {
    const q = sql();
    // updated_at is kept as the exact ISO string sent to the dashboard, so "was it changed elsewhere?"
    // checks compare identical strings.
    await q`CREATE TABLE IF NOT EXISTS site_content (
      id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      content jsonb NOT NULL,
      updated_at text NOT NULL
    )`;
    await q`CREATE TABLE IF NOT EXISTS content_history (
      id bigserial PRIMARY KEY,
      content jsonb NOT NULL,
      updated_at text NOT NULL
    )`;
    // ip holds a salted hash of the visitor's address (never the address), cleared after 30 days.
    await q`CREATE TABLE IF NOT EXISTS form_requests (
      id bigserial PRIMARY KEY,
      type text NOT NULL,
      data jsonb NOT NULL,
      lang text NOT NULL DEFAULT 'en',
      ip text,
      done boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`ALTER TABLE form_requests ALTER COLUMN ip DROP NOT NULL`;   // older tables had NOT NULL
    await q`CREATE TABLE IF NOT EXISTS login_failures (
      ip text PRIMARY KEY,
      fails integer NOT NULL,
      expires_at timestamptz NOT NULL
    )`;
  })().catch((e) => { schemaReady = undefined; throw e; }));

/* Reads skip the CREATE TABLE checks (5 extra round trips on the first visit to each server).
 * A table that doesn't exist yet simply means "nothing saved yet". */
const read = async (query, empty) => {
  try { return await query(); } catch (e) { if (e?.code === "42P01") return empty; throw e; }
};

/* -> { content, updatedAt } or null (nothing saved yet, or no database configured) */
export async function readStored() {
  if (!hasDb()) return null;
  const rows = await read(() => sql()`SELECT content, updated_at FROM site_content WHERE id = 1`, []);
  return rows[0] ? { content: rows[0].content, updatedAt: rows[0].updated_at } : null;
}

/* Saves new content; the replaced version goes to history (last MAX_HISTORY kept).
 * Returns { updatedAt } or { conflict: true } if baseUpdatedAt doesn't match the stored version. */
export async function saveContent(content, baseUpdatedAt) {
  await ensureSchema();
  const q = sql();
  const current = await readStored();
  if (current?.updatedAt && baseUpdatedAt !== undefined && baseUpdatedAt !== current.updatedAt) return { conflict: true };

  const updatedAt = new Date().toISOString();
  const json = JSON.stringify(content);
  // Every statement is conditional on the version we just read, so if someone else saved in between,
  // nothing is written (no stray history entry, no overwrite) and we report a conflict.
  const steps = current
    ? [
        q`INSERT INTO content_history (content, updated_at)
            SELECT content, updated_at FROM site_content WHERE id = 1 AND updated_at = ${current.updatedAt}`,
        q`DELETE FROM content_history WHERE id NOT IN (SELECT id FROM content_history ORDER BY id DESC LIMIT ${MAX_HISTORY})`,
        q`UPDATE site_content SET content = ${json}::jsonb, updated_at = ${updatedAt}
            WHERE id = 1 AND updated_at = ${current.updatedAt} RETURNING updated_at`,
      ]
    : [q`INSERT INTO site_content (id, content, updated_at) VALUES (1, ${json}::jsonb, ${updatedAt})
           ON CONFLICT (id) DO NOTHING RETURNING updated_at`];
  const results = await q.transaction(steps);
  const written = results[results.length - 1];
  if (!written?.length) return { conflict: true };
  return { updatedAt };
}

/* -> [{ updatedAt, content }] newest first */
export async function readHistory() {
  if (!hasDb()) return [];
  const rows = await read(() => sql()`SELECT content, updated_at FROM content_history ORDER BY id DESC LIMIT ${MAX_HISTORY}`, []);
  return rows.map((r) => ({ updatedAt: r.updated_at, content: r.content }));
}

/* ---------- Login rate limiting: per IP, plus one site-wide counter ---------- */
/* -> { mine, all }: wrong passwords in the last 15 minutes from this IP, and from everyone */
export async function loginFails(ip) {
  if (!hasDb()) return { mine: 0, all: 0 };
  const rows = await read(() => sql()`SELECT ip, fails FROM login_failures WHERE ip IN (${ip}, ${ALL}) AND expires_at > now()`, []);
  const of = (k) => rows.find((r) => r.ip === k)?.fails || 0;
  return { mine: of(ip), all: of(ALL) };
}

export async function recordLoginFail(ip) {
  if (!hasDb()) return;
  await ensureSchema();
  const q = sql();
  await q.transaction([
    // Per IP: the 15 minutes restart with every wrong attempt.
    q`INSERT INTO login_failures (ip, fails, expires_at)
      VALUES (${ip}, 1, now() + make_interval(secs => ${LOGIN_LOCK_SECONDS}))
      ON CONFLICT (ip) DO UPDATE SET
        fails = CASE WHEN login_failures.expires_at > now() THEN login_failures.fails + 1 ELSE 1 END,
        expires_at = now() + make_interval(secs => ${LOGIN_LOCK_SECONDS})`,
    // Site-wide: a fixed 15-minute window (not extended), so an attacker can't keep the admin locked out
    // for longer than 15 minutes at a time.
    q`INSERT INTO login_failures (ip, fails, expires_at)
      VALUES (${ALL}, 1, now() + make_interval(secs => ${LOGIN_LOCK_SECONDS}))
      ON CONFLICT (ip) DO UPDATE SET
        fails = CASE WHEN login_failures.expires_at > now() THEN login_failures.fails + 1 ELSE 1 END,
        expires_at = CASE WHEN login_failures.expires_at > now() THEN login_failures.expires_at
                          ELSE now() + make_interval(secs => ${LOGIN_LOCK_SECONDS}) END`,
    q`DELETE FROM login_failures WHERE expires_at < now() - interval '1 day'`,
  ]);
}

export async function clearLoginFails(ip) {
  if (!hasDb()) return;
  await sql()`DELETE FROM login_failures WHERE ip = ${ip}`;
}

/* ---------- Requests sent with the website's two forms ("Build your own course", "Corporate training") ---------- */
export const REQUESTS_PER_HOUR = 5;        // per visitor
export const REQUESTS_PER_HOUR_ALL = 60;   // all visitors together (stops a flood from rotating addresses)

/* -> { mine, total }: requests in the last hour from this visitor (by IP hash), and from everyone */
export async function recentRequests(ipHash) {
  const rows = await read(() => sql()`SELECT count(*)::int AS total, count(*) FILTER (WHERE ip = ${ipHash})::int AS mine
    FROM form_requests WHERE created_at > now() - interval '1 hour'`, [{ total: 0, mine: 0 }]);
  return rows[0];
}

export async function addRequest(type, data, lang, ipHash) {
  await ensureSchema();
  const q = sql();
  const [rows] = await q.transaction([
    q`INSERT INTO form_requests (type, data, lang, ip) VALUES (${type}, ${JSON.stringify(data)}::jsonb, ${lang}, ${ipHash}) RETURNING id`,
    // The IP hash is only needed for the hourly limit: forget it after 30 days (the request itself stays).
    q`UPDATE form_requests SET ip = NULL WHERE ip IS NOT NULL AND created_at < now() - interval '30 days'`,
  ]);
  return rows[0].id;
}

/* -> newest first (the dashboard inbox). The IP hash is not returned. */
export async function listRequests(limit = 200) {
  if (!hasDb()) return [];
  const rows = await read(() => sql()`SELECT id, type, data, lang, done, created_at FROM form_requests ORDER BY created_at DESC LIMIT ${limit}`, []);
  return rows.map((r) => ({ id: String(r.id), type: r.type, data: r.data, lang: r.lang, done: r.done, createdAt: new Date(r.created_at).toISOString() }));
}

export async function setRequestDone(id, done) {
  const rows = await read(() => sql()`UPDATE form_requests SET done = ${!!done} WHERE id = ${id} RETURNING id`, []);
  return rows.length > 0;
}
