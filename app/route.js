/* GET /  -> the website, in English or Arabic, with the admin's saved content (from Neon) applied on the server.
 * Language: ?lang=en|ar (the switch in the header) > remembered choice (cookie) > browser language > English. */
import { readStored } from "@/lib/db";
import { loadTemplate, loadDefaults, renderHome, htmlResponse } from "@/lib/render";
import { pickLang } from "@/lib/ui-strings";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { lang, fromQuery } = pickLang(request);
  let stored = null;
  try { stored = await readStored(); } catch (e) { console.error("Could not read saved content:", e.message); }

  const headers = { vary: "Cookie, Accept-Language" };
  // Remember an explicit choice for a year (not HttpOnly-sensitive: it only holds "en" or "ar").
  if (fromQuery) headers["set-cookie"] = `tawer_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return htmlResponse(renderHome(await loadTemplate("home.html"), stored?.content, lang, await loadDefaults()), headers);
}
