/* GET /content.js -> the default content (data/*.json) for the browser: window.TAWER_DEFAULT = {...}
 * Used by the website (public/site.js) and the dashboard (public/admin/admin.js).
 * Anything saved from the dashboard (database) always wins over these defaults. */
import { DEFAULTS } from "@/lib/defaults";
import { safeJson } from "@/lib/render";

export const dynamic = "force-static";

const body = `window.TAWER_DEFAULT = ${safeJson(DEFAULTS)};\n`;

export function GET() {
  return new Response(body, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-cache" } });
}
