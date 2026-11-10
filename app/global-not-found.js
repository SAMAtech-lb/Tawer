/* The "page not found" page for every unknown address (website and dashboard alike). It has its own <html>,
 * because the site has two root layouts (app/(site) and app/(admin)). Language: the visitor's remembered choice,
 * else the browser language, like the website. Enabled by experimental.globalNotFound in next.config.mjs. */
import "remixicon/fonts/remixicon.css";
import "./(site)/site.css";
import { cookies, headers } from "next/headers";
import { fontVariables } from "@/lib/fonts";
import { LANGS, browserLang } from "@/lib/ui-strings";

export const metadata = { title: "Page not found · Tawer Academy", robots: { index: false, follow: true } };

const TEXT = {
  en: { title: "We couldn’t find that page", text: "The link may be old, or the address may have a typo.", home: "Back to the home page", alt: "العربية" },
  ar: { title: "لم نجد هذه الصفحة", text: "ربما الرابط قديم، أو في العنوان خطأ في الكتابة.", home: "العودة إلى الصفحة الرئيسية", alt: "English" },
};

export default async function GlobalNotFound() {
  const saved = (await cookies()).get("tawer_lang")?.value;
  const lang = LANGS.includes(saved) ? saved : browserLang((await headers()).get("accept-language"));
  const T = TEXT[lang] || TEXT.en;
  const other = lang === "ar" ? "en" : "ar";
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={fontVariables} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main className="nf">
          <a href="/" className="logo" aria-label="Tawer Academy">
            <span className="logo__mark">T<i /></span>
            <span className="logo__text">Tawer<small>Academy</small></span>
          </a>
          <p className="nf__code" aria-hidden="true">404</p>
          <h1>{T.title}</h1>
          <p className="nf__text">{T.text}</p>
          <div className="nf__actions">
            <a href={`/?lang=${lang}`} className="btn btn--lg"><i className="ri-home-4-line" aria-hidden="true" /> {T.home}</a>
            <a href={`/?lang=${other}`} className="btn btn--outline btn--lg" lang={other}>{T.alt}</a>
          </div>
        </main>
      </body>
    </html>
  );
}
