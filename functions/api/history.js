import { json, fail, isAdmin } from "../_shared/lib.js";

/* GET /api/history -> { versions: [{ updatedAt, content }, ...] } newest first (admin only).
 * Each save keeps the version it replaced, up to the last 10. */
export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return fail(401, "Your session has expired. Please log in again.");
  const versions = env.CONTENT ? (await env.CONTENT.get("history", { type: "json" })) || [] : [];
  return json({ versions });
}
