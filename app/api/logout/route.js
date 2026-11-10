import { json, clearSessionCookie } from "@/lib/auth";

/* POST /api/logout -> clears the admin session cookie */
export async function POST() {
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
