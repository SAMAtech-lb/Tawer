/* The website's home page. Text comes from the database first, then the JSON defaults (lib/site-content.js),
 * in the language picked by proxy.js. Sections are in components/site/. */
import { getLang, loadSiteContent } from "@/lib/site-content";
import { jsonLd, makeT, makeWa, plain, waNumber } from "@/lib/site-helpers";
import { LANG_ALTERNATES, SHARE_IMAGE, SITE_URL, pageUrl, structuredData } from "@/lib/seo";
import { SiteProvider } from "@/components/site/SiteContext";
import { BackToTop, RevealObserver } from "@/components/site/Effects";
import Topbar from "@/components/site/Topbar";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import About, { ExamStrip } from "@/components/site/About";
import Levels from "@/components/site/Levels";
import Courses from "@/components/site/Courses";
import PlacementTest from "@/components/site/PlacementTest";
import Why, { HowItWorks } from "@/components/site/Why";
import Stories from "@/components/site/Stories";
import Reviews from "@/components/site/Reviews";
import Pricing from "@/components/site/Pricing";
import { Blog, CtaBand, Faq } from "@/components/site/Sections";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";

export async function generateMetadata() {
  const lang = await getLang();
  const { content: C } = await loadSiteContent(lang);
  const seo = C.seo || {};
  const share = { title: plain(seo.shareTitle || seo.title), description: plain(seo.shareDescription || seo.description) };
  return {
    metadataBase: new URL(SITE_URL),
    title: plain(seo.title),
    description: plain(seo.description),
    // Each language is its own page for Google: canonical = itself, hreflang lists both.
    alternates: { canonical: pageUrl(lang), languages: LANG_ALTERNATES },
    openGraph: {
      type: "website", siteName: "Tawer Academy", url: pageUrl(lang), ...share,
      locale: lang === "ar" ? "ar_SA" : "en_US", alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
      images: [{ ...SHARE_IMAGE, alt: share.title }],
    },
    twitter: { card: "summary_large_image", ...share, images: [SHARE_IMAGE.url] },
  };
}

export default async function HomePage() {
  const lang = await getLang();
  const { content: C, ui } = await loadSiteContent(lang);
  const t = makeT(ui);
  const num = waNumber(C);
  const wa = makeWa(num, t);


  return (
    <SiteProvider lang={lang} ui={ui} waNum={num}>
      {structuredData(C, lang).map((block, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(block) }} />)}
      <Topbar C={C} />
      <Header />
      <main id="top">
        <Hero C={C} />
        <ExamStrip C={C} t={t} />
        <About C={C} />
        <Levels levels={C.levels || {}} />
        <Courses courses={C.courses || {}} />
        <PlacementTest test={C.test || {}} />
        <HowItWorks C={C} />
        <Why C={C} />
        <Stories stories={C.stories || {}} />
        <Reviews reviews={C.reviews || {}} />
        <Pricing C={C} t={t} wa={wa} />
        <Faq C={C} wa={wa} />
        <Blog C={C} />
        <CtaBand C={C} wa={wa} />
        <Contact C={C} t={t} wa={wa} />
      </main>
      <Footer C={C} t={t} />
      <a {...wa("wa.trial")} className="wa-float" aria-label={t("a11y.whatsapp", "Chat on WhatsApp")}><i className="ri-whatsapp-line" /></a>
      <BackToTop label={t("a11y.top", "Back to top")} />
      <RevealObserver />
    </SiteProvider>
  );
}
