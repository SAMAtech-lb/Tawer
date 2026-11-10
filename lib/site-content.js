/* Loads what the website shows: saved content from the database first, the JSON defaults for the rest,
 * then (for Arabic) the Arabic text over the English one. Server only. */
import { cache } from "react";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { DEFAULTS } from "./defaults";
import { readStored } from "./db";
import { merge, translate } from "./format";
import { UI, LANGS } from "./ui-strings";

/* The language picked by proxy.js (?lang= > remembered choice > browser language > English). */
export async function getLang() {
  const lang = (await headers()).get("x-tawer-lang");
  return LANGS.includes(lang) ? lang : "en";
}

/* The saved content is kept in Next's cache, so a normal visit doesn't wait for the database.
 * Saving in the dashboard clears it at once (revalidateTag in app/api/content/route.js); after 10 minutes
 * it is read again anyway, in case a save happened on another server. */
export const CONTENT_TAG = "site-content";
const readStoredCached = unstable_cache(readStored, ["site-content-v1"], { tags: [CONTENT_TAG], revalidate: 600 });

/* cache(): the page and its <head> metadata share one lookup per request. */
export const loadSiteContent = cache(async (lang) => {
  let stored = null;
  try { stored = await readStoredCached(); } catch (e) { console.error("Could not read saved content:", e.message); }
  const full = merge(DEFAULTS, stored?.content || {});
  return { content: lang === "ar" ? translate(full, full.ar) : full, ui: UI[lang] || {} };
});
