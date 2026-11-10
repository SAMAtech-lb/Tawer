/* /llms.txt: a short plain-text summary of the academy for AI assistants (ChatGPT, Perplexity…), built from the
 * same content as the website, so it is always up to date. Google ignores this file; it doesn't hurt either. */
import { DEFAULTS } from "@/lib/defaults";
import { merge } from "@/lib/format";
import { readStoredCached } from "@/lib/site-content";
import { arr, plain } from "@/lib/site-helpers";
import { pageUrl, realLink, realPhone } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  let stored = null;
  try { stored = await readStoredCached(); } catch { /* defaults only */ }
  const C = merge(DEFAULTS, stored?.content || {});
  const line = (s) => plain(s).replace(/\s*\n\s*/g, " ").trim();
  const out = [
    "# Tawer Academy",
    "",
    `> ${line(C.seo?.description)}`,
    "",
    `- Website (English): ${pageUrl("en")}`,
    `- Website (Arabic): ${pageUrl("ar")}`,
    ...(C.contact?.email ? [`- Email: ${C.contact.email}`] : []),
    ...(realPhone(C.contact?.phone) ? [`- Phone: ${realPhone(C.contact.phone)}`] : []),
    "",
    "## Courses",
    ...arr(C.courses?.items).map((c) => `- ${line(c.title)}${c.level ? ` (${line(c.level)})` : ""}: ${line(c.desc)}`),
    "",
    "## Levels",
    ...arr(C.levels?.items).map((l) => `- ${line(l.code)} ${line(l.name)}`),
    "",
    "## Frequently asked questions",
    ...arr(C.faq?.items).flatMap((f) => [`### ${line(f.q)}`, line(f.a), ""]),
  ];
  const links = Object.entries(C.social || {}).map(([k, v]) => [k, realLink(v)]).filter(([, v]) => v);
  if (links.length) out.push("## Links", ...links.map(([k, v]) => `- ${k}: ${v}`), "");
  return new Response(out.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
