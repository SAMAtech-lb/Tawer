/* Neon Postgres storage for the site content, its version history and login rate limiting.
 * Needs DATABASE_URL (Neon connection string) in .env. Tables are created automatically on first use. */
import { neon } from "@neondatabase/serverless";

export const MAX_HISTORY = 10;
export const LOGIN_MAX_FAILS = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;

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
    await q`CREATE TABLE IF NOT EXISTS form_requests (
      id bigserial PRIMARY KEY,
      type text NOT NULL,
      data jsonb NOT NULL,
      lang text NOT NULL DEFAULT 'en',
      ip text NOT NULL,
      done boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS login_failures (
      ip text PRIMARY KEY,
      fails integer NOT NULL,
      expires_at timestamptz NOT NULL
    )`;
  })().catch((e) => { schemaReady = undefined; throw e; }));

/* -> { content, updatedAt } or null (nothing saved yet, or no database configured) */
export async function readStored() {
  if (!hasDb()) return null;
  await ensureSchema();
  const rows = await sql()`SELECT content, updated_at FROM site_content WHERE id = 1`;
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
  await ensureSchema();
  const rows = await sql()`SELECT content, updated_at FROM content_history ORDER BY id DESC LIMIT ${MAX_HISTORY}`;
  return rows.map((r) => ({ updatedAt: r.updated_at, content: r.content }));
}

/* ---------- Login rate limiting (per IP) ---------- */
export async function loginFails(ip) {
  if (!hasDb()) return 0;
  await ensureSchema();
  const rows = await sql()`SELECT fails FROM login_failures WHERE ip = ${ip} AND expires_at > now()`;
  return rows[0]?.fails || 0;
}

export async function recordLoginFail(ip) {
  if (!hasDb()) return;
  await ensureSchema();
  await sql()`INSERT INTO login_failures (ip, fails, expires_at)
    VALUES (${ip}, 1, now() + make_interval(secs => ${LOGIN_LOCK_SECONDS}))
    ON CONFLICT (ip) DO UPDATE SET
      fails = CASE WHEN login_failures.expires_at > now() THEN login_failures.fails + 1 ELSE 1 END,
      expires_at = now() + make_interval(secs => ${LOGIN_LOCK_SECONDS})`;
}

export async function clearLoginFails(ip) {
  if (!hasDb()) return;
  await sql()`DELETE FROM login_failures WHERE ip = ${ip}`;
}

/* ---------- Requests sent with the website's two forms ("Build your own course", "Corporate training") ---------- */
export const REQUESTS_PER_HOUR = 5;

export async function recentRequestsFrom(ip) {
  await ensureSchema();
  const rows = await sql()`SELECT count(*)::int AS n FROM form_requests WHERE ip = ${ip} AND created_at > now() - interval '1 hour'`;
  return rows[0].n;
}

export async function addRequest(type, data, lang, ip) {
  await ensureSchema();
  const rows = await sql()`INSERT INTO form_requests (type, data, lang, ip) VALUES (${type}, ${JSON.stringify(data)}::jsonb, ${lang}, ${ip}) RETURNING id`;
  return rows[0].id;
}

/* -> newest first (the dashboard inbox). The visitor's IP is not returned. */
export async function listRequests(limit = 200) {
  if (!hasDb()) return [];
  await ensureSchema();
  const rows = await sql()`SELECT id, type, data, lang, done, created_at FROM form_requests ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({ id: String(r.id), type: r.type, data: r.data, lang: r.lang, done: r.done, createdAt: new Date(r.created_at).toISOString() }));
}

export async function setRequestDone(id, done) {
  await ensureSchema();
  const rows = await sql()`UPDATE form_requests SET done = ${!!done} WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
