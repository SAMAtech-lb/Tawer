import { json, isAdmin, hasPassword } from "@/lib/auth";
import { hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/* GET /api/session -> { admin: true|false, configured: { password, storage } } */
export async function GET(request) {
  return json({ admin: await isAdmin(request), configured: { password: hasPassword(), storage: hasDb() } });
}
