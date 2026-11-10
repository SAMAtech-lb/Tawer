/* Root layout of the public website (English or Arabic, chosen by proxy.js). */
import "remixicon/fonts/remixicon.css";
import "./site.css";
import { preconnect } from "react-dom";
import { fontVariables } from "@/lib/fonts";
import { getLang } from "@/lib/site-content";

export const viewport = { themeColor: "#6A0DAD", width: "device-width", initialScale: 1 };

export default async function SiteLayout({ children }) {
  const lang = await getLang();
  preconnect("https://images.unsplash.com");   // the photos (incl. the hero image) come from Unsplash's CDN
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla's cz-shortcut-listen, Grammarly) add attributes
    // to <html>/<body> before React loads. This only ignores attribute differences on these two tags.
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={fontVariables} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
