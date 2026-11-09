/* Shared helpers for the Pages Functions (not a route: exports no onRequest handlers). */

export const COOKIE = "tawer_admin";
export const SESSION_HOURS = 8;
export const MAX_HISTORY = 10;
export const MAX_BODY_BYTES = 1_000_000;
export const LOGIN_MAX_FAILS = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;

/* Top-level groups the content may contain (anything else is rejected on save). */
export const CONTENT_GROUPS = [
  "seo", "contact", "social", "hero", "exams", "about", "levels", "courses", "test",
  "how", "why", "stories", "reviews", "teachers" /* legacy, no longer shown */, "pricing", "faq", "blog", "cta", "footer",
];

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const fail = (status, error) => json({ error }, status);

/* ---------- Text formatting (must match public/site.js) ---------- */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
export const fmt = (s, hl = "") => esc(s)
  .replace(/\[\[(.+?)\]\]/g, `<span${hl ? ` class="${esc(hl)}"` : ""}>$1</span>`)
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/\n/g, "<br />");
export const plain = (s) => String(s ?? "").replace(/\[\[|\]\]|\*\*/g, "");
export const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/* ---------- KV ---------- */
export const kv = (env) => {
  if (!env.CONTENT) throw new Error("KV namespace binding 'CONTENT' is not configured.");
  return env.CONTENT;
};
export const readStored = async (env) => (env.CONTENT ? env.CONTENT.get("content", { type: "json" }) : null);

/* ---------- Crypto ---------- */
const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (s) => crypto.subtle.digest("SHA-256", enc.encode(s));
const hmac = async (secret, msg) => {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
};
const sameBytes = (a, b) => {
  const x = new Uint8Array(a), y = new Uint8Array(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
};
/* Constant-time comparison of two strings (compares their SHA-256 digests). */
export const safeEqual = async (a, b) => sameBytes(await sha256(String(a)), await sha256(String(b)));

/* The signing key is derived from SESSION_SECRET if set, otherwise from the admin password,
 * so changing the password logs out every existing session. */
const signingKey = (env) => "tawer-session:" + (env.SESSION_SECRET || env.ADMIN_PASSWORD || "");

export const makeSessionCookie = async (env) => {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const token = `${exp}.${await hmac(signingKey(env), String(exp))}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
};
export const clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

const readCookie = (request, name) => {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
};

export const isAdmin = async (request, env) => {
  if (!env.ADMIN_PASSWORD) return false;
  const token = readCookie(request, COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(+exp > Date.now())) return false;
  return safeEqual(sig, await hmac(signingKey(env), exp));
};

/* Blocks cross-site form posts: state-changing requests must be JSON from this same origin. */
export const sameOriginJson = (request) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return (request.headers.get("content-type") || "").includes("application/json");
};

export const readJsonBody = async (request) => {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("Content is too large.");
  return JSON.parse(text);
};
