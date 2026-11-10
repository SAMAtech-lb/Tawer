import { json, fail, isAdmin } from "@/lib/auth";
import { readHistory } from "@/lib/db";

export const dynamic = "force-dynamic";

/* GET /api/history -> { versions: [{ updatedAt, content }, ...] } newest first (admin only).
 * Each save keeps the version it replaced, up to the last 10. */
export async function GET(request) {
  if (!(await isAdmin(request))) return fail(401, "Your session has expired. Please log in again.");
  try {
    return json({ versions: await readHistory() });
  } catch (e) {
    console.error("Could not read history:", e.message);
    return fail(500, "Could not read the history. Try again in a moment.");
  }
}
