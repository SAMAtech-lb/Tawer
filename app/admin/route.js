/* GET /admin  -> the content dashboard (login happens in the page through /api/login). */
import { loadTemplate, htmlResponse } from "@/lib/render";

export const dynamic = "force-dynamic";

export async function GET() {
  return htmlResponse(await loadTemplate("admin.html"), { "x-robots-tag": "noindex, nofollow", "x-frame-options": "DENY" });
}
