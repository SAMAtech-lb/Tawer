/* The website's home page. Text comes from the database first, then the JSON defaults (lib/site-content.js),
 * in the language picked by proxy.js. Sections are in components/site/. */
import { getLang, loadSiteContent } from "@/lib/site-content";
import { arr, jsonLd, makeT, makeWa, plain, waNumber } from "@/lib/site-helpers";
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

const SITE_URL = "https://www.tawer-academy.com/";

export async function generateMetadata() {
  const lang = await getLang();
  const { content: C } = await loadSiteContent(lang);
  const seo = C.seo || {};
  return {
    title: plain(seo.title),
    description: plain(seo.description),
    alternates: { canonical: SITE_URL, languages: { en: `${SITE_URL}?lang=en`, ar: `${SITE_URL}?lang=ar`, "x-default": SITE_URL } },
    openGraph: {
      type: "website",
      title: plain(seo.shareTitle || seo.title),
      description: plain(seo.shareDescription || seo.description),
      locale: lang === "ar" ? "ar_SA" : "en_US",
      images: ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function HomePage() {
  const lang = await getLang();
  const { content: C, ui } = await loadSiteContent(lang);
  const t = makeT(ui);
  const num = waNumber(C);
  const wa = makeWa(num, t);

  const org = {
    "@context": "https://schema.org", "@type": "EducationalOrganization", name: "Tawer Academy",
    description: plain(C.seo?.description), url: SITE_URL, telephone: C.contact?.phone, email: C.contact?.email,
    hasOfferCatalog: { "@type": "OfferCatalog", name: "English courses",
      itemListElement: arr(C.courses?.items).map((c) => ({ "@type": "Course", name: plain(c.title), provider: { "@type": "Organization", name: "Tawer Academy" } })) },
  };
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: arr(C.faq?.items).map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
  };

  return (
    <SiteProvider lang={lang} ui={ui} waNum={num}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} />
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
