/* Admin session (signed cookie) and request helpers for the API route handlers. */
// In production the "__Host-" prefix makes the browser refuse the cookie unless it is Secure, Path=/ and has no
// Domain, so no other (sub)domain or plain-http page can set or overwrite it.
export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-tawer_admin" : "tawer_admin";
export const SESSION_HOURS = 8;
export const MAX_BODY_BYTES = 1_000_000;

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const fail = (status, error) => json({ error }, status);

const password = () => process.env.ADMIN_PASSWORD || "";
export const hasPassword = () => !!password();

/* ---------- Crypto (Web Crypto, built into Node 18+) ---------- */
const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = (s) => crypto.subtle.digest("SHA-256", enc.encode(s));
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

/* Signing key comes from SESSION_SECRET if set, otherwise the admin password,
 * so changing the password logs out every existing session. */
const signingKey = () => "tawer-session:" + (process.env.SESSION_SECRET || password());

const cookieFlags = () => `Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

export const makeSessionCookie = async () => {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const token = `${exp}.${await hmac(signingKey(), String(exp))}`;
  return `${COOKIE}=${token}; ${cookieFlags()}; Max-Age=${SESSION_HOURS * 3600}`;
};
export const clearSessionCookie = () => `${COOKIE}=; ${cookieFlags()}; Max-Age=0`;

const readCookie = (request, name) => {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
};

export const isAdmin = async (request) => {
  if (!hasPassword()) return false;
  const token = readCookie(request, COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(+exp > Date.now())) return false;
  return safeEqual(sig, await hmac(signingKey(), exp));
};

/* Blocks cross-site form posts: state-changing requests must be JSON from this same origin. */
// Compares against the Host the browser used (request.url can name a different host, e.g. "localhost"
// when the page was opened as 127.0.0.1, or the internal address behind a hosting proxy).
export const sameOriginJson = (request) => {
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    let originHost;
    try { originHost = new URL(origin).host; } catch { return false; }
    if (!host || originHost !== host.split(",")[0].trim()) return false;
  }
  return (request.headers.get("content-type") || "").includes("application/json");
};

export const readJsonBody = async (request) => {
  // Refuse a body that says it is too big before reading it, then check the real size too.
  if (+(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) throw new Error("Content is too large.");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("Content is too large.");
  return JSON.parse(text);
};

/* Client IP for rate limiting. Anyone can send their own "X-Forwarded-For", so its FIRST entry can't be trusted.
 * Use the header the hosting platform sets itself (Vercel / Cloudflare / a reverse proxy), else the LAST hop
 * (added by the closest proxy). Without any proxy in front even that can be faked, which is why the login and
 * form limits also have site-wide caps that don't depend on the IP (lib/db.js). */
export const clientIp = (request) => {
  const h = (name) => (request.headers.get(name) || "").trim();
  const platform = h("x-vercel-forwarded-for").split(",")[0].trim() || h("cf-connecting-ip") || h("x-real-ip");
  if (platform) return platform.slice(0, 64);
  const hops = h("x-forwarded-for").split(",").map((x) => x.trim()).filter(Boolean);
  return (hops[hops.length - 1] || "unknown").slice(0, 64);
};

/* Salted hash of an IP: enough to count requests per visitor without storing the address itself. */
export const ipHash = async (ip) => toHex(await sha256("tawer-ip:" + (process.env.SESSION_SECRET || password()) + ":" + ip)).slice(0, 32);
