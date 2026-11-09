import { json, fail, isAdmin, kv, readStored, sameOriginJson, readJsonBody, CONTENT_GROUPS, MAX_HISTORY } from "../_shared/lib.js";

/* GET /api/content -> { content, updatedAt } (content is null until the admin saves once) */
export async function onRequestGet({ env }) {
  const stored = await readStored(env);
  return json({ content: stored?.content ?? null, updatedAt: stored?.updatedAt ?? null });
}

/* PUT /api/content  { content, baseUpdatedAt } -> saves new site content (admin only) */
export async function onRequestPut({ request, env }) {
  if (!(await isAdmin(request, env))) return fail(401, "Your session has expired. Please log in again.");
  if (!sameOriginJson(request)) return fail(400, "Bad request.");

  let body;
  try { body = await readJsonBody(request); } catch (e) { return fail(400, e.message || "Invalid JSON."); }
  const content = body?.content;
  const problem = validate(content);
  if (problem) return fail(400, problem);

  let store;
  try { store = kv(env); } catch (e) { return fail(500, e.message); }

  const current = await store.get("content", { type: "json" });
  // Refuse to overwrite a newer version saved from another tab/device.
  if (current?.updatedAt && body.baseUpdatedAt !== undefined && body.baseUpdatedAt !== current.updatedAt) {
    return fail(409, "The content was changed somewhere else (another tab or device) since you opened it. Reload to get the latest version.");
  }

  if (current) {
    const history = (await store.get("history", { type: "json" })) || [];
    history.unshift(current);
    await store.put("history", JSON.stringify(history.slice(0, MAX_HISTORY)));
  }
  const updatedAt = new Date().toISOString();
  await store.put("content", JSON.stringify({ content, updatedAt }));
  return json({ ok: true, updatedAt });
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function validate(content) {
  if (!isObj(content)) return "Content must be an object.";
  for (const k of Object.keys(content)) {
    if (!CONTENT_GROUPS.includes(k)) return `Unknown content section "${k}".`;
    if (!isObj(content[k])) return `Section "${k}" must be an object.`;
  }
  // Only plain JSON values, limited nesting.
  const walk = (v, depth) => {
    if (depth > 6) return "Content is nested too deeply.";
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      if (typeof v === "string" && v.length > 20000) return "A text field is too long.";
      return null;
    }
    if (Array.isArray(v)) {
      if (v.length > 200) return "A list has too many items.";
      for (const x of v) { const p = walk(x, depth + 1); if (p) return p; }
      return null;
    }
    if (isObj(v)) {
      for (const x of Object.values(v)) { const p = walk(x, depth + 1); if (p) return p; }
      return null;
    }
    return "Content contains an unsupported value.";
  };
  return walk(content, 0);
}
