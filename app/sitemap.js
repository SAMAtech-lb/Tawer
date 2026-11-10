/* /sitemap.xml: the home page in English and in Arabic, each listing the other language (hreflang).
 * "Last modified" is the last time the content was saved in the dashboard. */
import { LANG_ALTERNATES, pageUrl } from "@/lib/seo";
import { readStoredCached } from "@/lib/site-content";

export const revalidate = 3600;

export default async function sitemap() {
  let lastModified;
  try { lastModified = (await readStoredCached())?.updatedAt; } catch { /* no database: leave it out */ }
  const languages = { en: LANG_ALTERNATES.en, ar: LANG_ALTERNATES.ar };
  return ["en", "ar"].map((lang) => ({
    url: pageUrl(lang),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "monthly",
    priority: lang === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}
