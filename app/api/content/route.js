import { json, fail, isAdmin, sameOriginJson, readJsonBody } from "@/lib/auth";
import { hasDb, readStored, saveContent } from "@/lib/db";
import { validateContent } from "@/lib/content";

export const dynamic = "force-dynamic";

/* GET /api/content -> { content, updatedAt } (content is null until the admin saves once) */
export async function GET() {
  try {
    const stored = await readStored();
    return json({ content: stored?.content ?? null, updatedAt: stored?.updatedAt ?? null });
  } catch (e) {
    return fail(500, "Could not read the saved content: " + e.message);
  }
}

/* PUT /api/content  { content, baseUpdatedAt } -> saves new site content (admin only) */
export async function PUT(request) {
  if (!(await isAdmin(request))) return fail(401, "Your session has expired. Please log in again.");
  if (!sameOriginJson(request)) return fail(400, "Bad request.");
  if (!hasDb()) return fail(500, "The database isn't configured (DATABASE_URL).");

  let body;
  try { body = await readJsonBody(request); } catch (e) { return fail(400, e.message || "Invalid JSON."); }
  const problem = validateContent(body?.content);
  if (problem) return fail(400, problem);

  try {
    const result = await saveContent(body.content, body.baseUpdatedAt);
    // Refuse to overwrite a newer version saved from another tab/device.
    if (result.conflict) {
      return fail(409, "The content was changed somewhere else (another tab or device) since you opened it. Reload to get the latest version.");
    }
    return json({ ok: true, updatedAt: result.updatedAt });
  } catch (e) {
    return fail(500, "Could not save: " + e.message);
  }
}
