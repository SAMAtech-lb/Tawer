import { json, fail, safeEqual, makeSessionCookie, sameOriginJson, readJsonBody, LOGIN_MAX_FAILS, LOGIN_LOCK_SECONDS } from "../_shared/lib.js";

/* POST /api/login  { password } -> sets the admin session cookie */
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return fail(500, "The admin password is not configured on the server (ADMIN_PASSWORD).");
  if (!sameOriginJson(request)) return fail(400, "Bad request.");

  // Basic brute-force protection: lock an IP out for 15 minutes after 5 wrong passwords.
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rlKey = `login-fails:${ip}`;
  const fails = env.CONTENT ? +(await env.CONTENT.get(rlKey)) || 0 : 0;
  if (fails >= LOGIN_MAX_FAILS) return fail(429, "Too many wrong attempts. Try again in 15 minutes.");

  let body;
  try { body = await readJsonBody(request); } catch { return fail(400, "Bad request."); }

  if (!(await safeEqual(body?.password ?? "", env.ADMIN_PASSWORD))) {
    if (env.CONTENT) await env.CONTENT.put(rlKey, String(fails + 1), { expirationTtl: LOGIN_LOCK_SECONDS });
    return fail(401, "Wrong password.");
  }

  if (fails && env.CONTENT) await env.CONTENT.delete(rlKey);
  return json({ ok: true }, 200, { "set-cookie": await makeSessionCookie(env) });
}
