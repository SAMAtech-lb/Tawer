import { json, fail, safeEqual, makeSessionCookie, sameOriginJson, readJsonBody, hasPassword, clientIp } from "@/lib/auth";
import { loginFails, recordLoginFail, clearLoginFails, LOGIN_MAX_FAILS, LOGIN_MAX_FAILS_ALL } from "@/lib/db";

export const dynamic = "force-dynamic";

/* POST /api/login  { password } -> sets the admin session cookie */
export async function POST(request) {
  if (!hasPassword()) return fail(500, "The admin password is not configured on the server (ADMIN_PASSWORD).");
  if (!sameOriginJson(request)) return fail(400, "Bad request.");

  // Brute-force protection: 5 wrong passwords lock that IP out for 15 minutes, and 30 wrong passwords from
  // everyone together lock all logins for 15 minutes (so changing the IP for every guess doesn't help).
  const ip = clientIp(request);
  let fails = { mine: 0, all: 0 };
  try { fails = await loginFails(ip); } catch (e) { console.error("Login rate limit check failed:", e.message); }
  if (fails.mine >= LOGIN_MAX_FAILS || fails.all >= LOGIN_MAX_FAILS_ALL) {
    return fail(429, "Too many wrong attempts. Try again in 15 minutes.");
  }

  let body;
  try { body = await readJsonBody(request); } catch { return fail(400, "Bad request."); }

  if (!(await safeEqual(body?.password ?? "", process.env.ADMIN_PASSWORD))) {
    try { await recordLoginFail(ip); } catch (e) { console.error("Could not record failed login:", e.message); }
    return fail(401, "Wrong password.");
  }

  if (fails.mine) { try { await clearLoginFails(ip); } catch { /* not critical */ } }
  return json({ ok: true }, 200, { "set-cookie": await makeSessionCookie() });
}
