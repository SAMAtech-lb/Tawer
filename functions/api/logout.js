import { json, clearSessionCookie } from "../_shared/lib.js";

/* POST /api/logout -> clears the admin session cookie */
export async function onRequestPost() {
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
