/* Fonts, served by Next.js itself (next/font): Lexend (headings), DM Sans (text),
 * Cairo + Tajawal for Arabic. Exposed as CSS variables used in site.css / admin.css.
 * Only the English fonts are preloaded: preloading is the same for every visitor, and most pages are English, so
 * English visitors don't download the (large) Arabic fonts. Arabic pages still load Cairo/Tajawal through the CSS. */
import { Cairo, DM_Sans, Lexend, Tajawal } from "next/font/google";

const lexend = Lexend({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-lexend", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dmsans", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["500", "600", "700"], variable: "--font-cairo", display: "swap", preload: false });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-tajawal", display: "swap", preload: false });

export const fontVariables = [lexend.variable, dmSans.variable, cairo.variable, tajawal.variable].join(" ");
