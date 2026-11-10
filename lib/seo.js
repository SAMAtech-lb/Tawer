/* Search-engine helpers shared by the home page, sitemap.xml, robots.txt and llms.txt. Server only. */
import { arr, plain, safeUrl } from "./site-helpers";

/* The public address of the site (SITE_URL in .env), without a trailing slash. Set it before launch:
 * canonical tags, the sitemap and the structured data all use it. */
export const SITE_URL = (process.env.SITE_URL || "https://www.tawer-academy.com").replace(/\/+$/, "");

/* One address per language. English is the plain home page (what Google sees without a language preference),
 * Arabic is ?lang=ar. Each language points to itself as canonical, and both list each other (hreflang). */
export const pageUrl = (lang) => (lang === "ar" ? `${SITE_URL}/?lang=ar` : `${SITE_URL}/`);
export const LANG_ALTERNATES = { en: pageUrl("en"), ar: pageUrl("ar"), "x-default": pageUrl("en") };

/* A link the admin really filled in (placeholders like "#" or empty are left out of search data). */
export const realLink = (u) => { const s = safeUrl(u); return s !== "#" && /^https?:\/\//i.test(s) ? s : ""; };
/* A phone number that isn't the placeholder (+000 00 000 000). */
export const realPhone = (p) => { const d = String(p || "").replace(/\D/g, ""); return d.length >= 8 && !/^0+$/.test(d) ? String(p).trim() : ""; };

export const SHARE_IMAGE = { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80", width: 1200, height: 630 };

/* Structured data (JSON-LD) for the home page: the website, the academy, its courses and the FAQ.
 * Built only from the site's content; placeholder phone numbers and links are left out. */
export function structuredData(C, lang) {
  const org = `${SITE_URL}/#organization`;
  const phone = realPhone(C.contact?.phone);
  const sameAs = Object.values(C.social || {}).map(realLink).filter(Boolean);
  const inLanguage = lang === "ar" ? "ar" : "en";
  return [
    {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: pageUrl(lang), name: "Tawer Academy", inLanguage, publisher: { "@id": org } },
        {
          "@type": "EducationalOrganization", "@id": org, name: "Tawer Academy", url: `${SITE_URL}/`,
          logo: `${SITE_URL}/icon.svg`, description: plain(C.seo?.description),
          ...(C.contact?.email ? { email: C.contact.email } : {}),
          ...(phone ? { telephone: phone } : {}),
          ...(sameAs.length ? { sameAs } : {}),
          hasOfferCatalog: {
            "@type": "OfferCatalog", name: lang === "ar" ? "دورات اللغة الإنجليزية" : "English courses",
            itemListElement: arr(C.courses?.items).map((c) => ({
              "@type": "Course", name: plain(c.title), description: plain(c.desc), inLanguage: "en",
              ...(c.level ? { educationalLevel: plain(c.level) } : {}),
              provider: { "@id": org },
            })),
          },
        },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage", inLanguage,
      mainEntity: arr(C.faq?.items).map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
    },
  ];
}
