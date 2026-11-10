/* Builds the HTML pages served by the Next.js routes.
 * The home page template is templates/home.html. On the server we:
 *  - pick the language (lib/ui-strings.js pickLang) and set <html lang dir>,
 *  - apply the admin's saved content (from Neon), in Arabic when lang = ar (content.ar over English),
 *  - translate the fixed interface text ([data-i18n], [data-i18n-attr]),
 * so visitors, search engines and link previews see the right text immediately (no flash of English).
 * Lists (courses, FAQ, stories…) are rendered in the browser by public/site.js from window.TAWER_CONTENT. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "node-html-parser";
import { esc, fmt, plain, getPath, translate, merge } from "./format.js";
import { UI } from "./ui-strings.js";
import { DEFAULTS } from "./defaults.js";

const templatePath = (name) => path.join(process.cwd(), "templates", name);
const cache = new Map();
export const loadTemplate = async (name) => {
  if (process.env.NODE_ENV !== "production" || !cache.has(name)) cache.set(name, await readFile(templatePath(name), "utf8"));
  return cache.get(name);
};

/* Default content (data/*.json via lib/defaults.js), so the server renders the same text the browser would show,
 * in both languages, even before the admin has saved anything. */
export const loadDefaults = async () => DEFAULTS;

// Escape "<" (so the JSON can't close the <script> tag) and the U+2028/U+2029 line separators.
// Built from char codes: a raw U+2028 inside a regex literal is a line break and breaks the bundle.
const UNSAFE_JSON_CHARS = new RegExp("[<" + String.fromCharCode(0x2028, 0x2029) + "]", "g");
export const safeJson = (v) => JSON.stringify(v).replace(UNSAFE_JSON_CHARS, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));

export function renderHome(template, content, lang = "en", defaults = null) {
  const doctype = template.match(/^\s*<!DOCTYPE[^>]*>/i)?.[0] || "<!DOCTYPE html>";
  const root = parse(template.replace(/^\s*<!DOCTYPE[^>]*>/i, ""), { comment: true });
  const html = root.querySelector("html");
  html?.setAttribute("lang", lang);
  html?.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  const ui = UI[lang] || {};

  // The language switch always links to the other language.
  const other = lang === "ar" ? "en" : "ar";
  root.querySelectorAll("[data-lang-switch]").forEach((el) => {
    el.setAttribute("href", `?lang=${other}`);
    el.setAttribute("hreflang", other);
    el.setAttribute("lang", other);
  });

  // Fixed interface text
  if (lang !== "en") {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = ui[el.getAttribute("data-i18n")];
      if (v) el.set_content(esc(v));
    });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      for (const pair of el.getAttribute("data-i18n-attr").split(";")) {
        const [attr, key] = pair.split(":").map((x) => x.trim());
        if (attr && ui[key]) el.setAttribute(attr, ui[key]);
      }
    });
  }

  // Saved content (Arabic over English when needed)
  // Saved content over the defaults (like the browser does), then Arabic over English when needed.
  const full = defaults ? merge(defaults, content || {}) : content;
  const view = full ? (lang === "ar" ? translate(full, full.ar) : full) : null;
  if (view) {
    const seo = view.seo || {};
    const setMeta = (selector, value) => {
      const el = root.querySelector(selector);
      if (el && typeof value === "string") el.setAttribute("content", plain(value));
    };
    const title = root.querySelector("title");
    if (title && typeof seo.title === "string") title.set_content(esc(plain(seo.title)));
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:title"]', seo.shareTitle);
    setMeta('meta[property="og:description"]', seo.shareDescription);

    root.querySelectorAll("[data-c]").forEach((el) => {
      const v = getPath(view, el.getAttribute("data-c"));
      if (typeof v === "string" || typeof v === "number") el.set_content(fmt(v, el.getAttribute("data-hl") || ""));
    });
    root.querySelectorAll("[data-cn]").forEach((el) => {
      const v = getPath(view, el.getAttribute("data-cn"));
      if (v !== undefined && v !== null) el.setAttribute("data-count", String(+v || 0));
    });
  }
  root.querySelector('meta[property="og:locale"]')?.setAttribute("content", lang === "ar" ? "ar_SA" : "en_US");

  const data = [`window.TAWER_LANG=${safeJson(lang)};`, `window.TAWER_UI=${safeJson(ui)};`];
  if (content) data.push(`window.TAWER_CONTENT=${safeJson(content)};`);
  root.querySelector("head")?.insertAdjacentHTML("beforeend", `<script>${data.join("")}</script>`);
  return doctype + "\n" + root.toString();
}

export const htmlResponse = (html, extraHeaders = {}) =>
  new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
