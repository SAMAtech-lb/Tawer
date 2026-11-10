import { json, fail, isAdmin, sameOriginJson, readJsonBody, clientIp } from "@/lib/auth";
import { hasDb, addRequest, listRequests, setRequestDone, recentRequestsFrom, REQUESTS_PER_HOUR } from "@/lib/db";
import { cleanRequest } from "@/lib/requests";

export const dynamic = "force-dynamic";

/* POST /api/requests  { type: "custom" | "corporate", data: {...}, lang, website }  (public: the website's forms) */
export async function POST(request) {
  if (!sameOriginJson(request)) return fail(400, "Bad request.");
  if (!hasDb()) return fail(503, "unavailable");
  let body;
  try { body = await readJsonBody(request); } catch { return fail(400, "Bad request."); }
  // Spam trap: a hidden field people never see; bots fill it in. Pretend it worked.
  if (body?.website) return json({ ok: true });
  const { data, error } = cleanRequest(body?.type, body?.data);
  if (error) return fail(400, error);
  const ip = clientIp(request);
  try {
    if ((await recentRequestsFrom(ip)) >= REQUESTS_PER_HOUR) return fail(429, "too-many");
    await addRequest(body.type, data, body?.lang === "ar" ? "ar" : "en", ip);
    return json({ ok: true });
  } catch (e) {
    console.error("Could not save request:", e.message);
    return fail(500, "unavailable");
  }
}

/* GET /api/requests -> { requests: [...] } newest first (admin only) */
export async function GET(request) {
  if (!(await isAdmin(request))) return fail(401, "Your session has expired. Please log in again.");
  try { return json({ requests: await listRequests() }); }
  catch (e) { return fail(500, "Could not load the requests: " + e.message); }
}

/* PATCH /api/requests { id, done } -> mark a request as handled / not handled (admin only) */
export async function PATCH(request) {
  if (!(await isAdmin(request))) return fail(401, "Your session has expired. Please log in again.");
  if (!sameOriginJson(request)) return fail(400, "Bad request.");
  let body;
  try { body = await readJsonBody(request); } catch { return fail(400, "Bad request."); }
  if (!/^\d+$/.test(String(body?.id || ""))) return fail(400, "Bad request.");
  try { return (await setRequestDone(String(body.id), !!body.done)) ? json({ ok: true }) : fail(404, "Request not found."); }
  catch (e) { return fail(500, "Could not update: " + e.message); }
}
