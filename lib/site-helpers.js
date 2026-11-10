/* Small helpers shared by server and client components (no server-only imports here). */

export const arr = (v) => (Array.isArray(v) ? v : []);

const FALLBACK_IMG = "1522202176988-66273c2fd55f";
/* Unsplash photo id -> image URL */
export const U = (id, w = 800) => `https://images.unsplash.com/photo-${id || FALLBACK_IMG}?auto=format&fit=crop&w=${w}&q=80`;

/* Text without the [[ ]] / ** formatting marks (for alt texts, aria-labels, titles…) */
export const plain = (s) => String(s ?? "").replace(/\[\[|\]\]|\*\*/g, "");

export const initials = (n) => plain(n).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/* Only allow normal links: web, mail, phone, "#section" and paths on this site.
 * "/page" is fine, "//other-site.com" or "/\other-site.com" (links to another site in disguise) and javascript: are not. */
export const safeUrl = (u) => (/^(https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(String(u || "").trim()) ? String(u).trim() : "#");

/* Fixed interface text: t(key, "English fallback", { vars }). Arabic comes from lib/ui-strings.js. */
export const makeT = (ui = {}) => (key, en, vars = {}) => String(ui[key] || en).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));

/* ---------- WhatsApp ---------- */
export const WA_MSG = {
  "wa.trial": "Hi Tawer Academy! I'd like to book a free trial session.",
  "wa.course": "Hi! I'd like to know more about the {course} course.",
  "wa.level": "Hi! I'd like to book a free trial session at level {code}.",
  "wa.plan": "Hi! I'd like to know the price of the {plan}.",
};
/* A phone number as wa.me wants it: country code + number, digits only.
 * "+966 55 123 4567" and "00966551234567" -> "966551234567". A local Saudi mobile ("055 123 4567") gets 966,
 * because the site asks for Saudi numbers (form placeholder "+966 5x xxx xxxx"). */
export const DEFAULT_COUNTRY_CODE = "966";
export const waDigits = (phone) => {
  const raw = String(phone || "").trim();
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  else if (!raw.startsWith("+") && /^05\d{8}$/.test(n)) n = DEFAULT_COUNTRY_CODE + n.slice(1);
  return n;
};

/* The WhatsApp number from the content (WhatsApp field, else phone), or "" while it's still a placeholder. */
export const waNumber = (C) => {
  const n = waDigits(C?.contact?.whatsapp) || waDigits(C?.contact?.phone);
  return n.length >= 8 && !/^0+$/.test(n) ? n : "";
};
/* Link props for a booking button: WhatsApp with a ready-made message, or the contact section until a number is set.
 * Usage: <a {...wa("wa.trial")} className="btn">…</a> */
export const makeWa = (num, t) => (key = "wa.trial", vars) =>
  num
    ? { href: `https://wa.me/${num}?text=${encodeURIComponent(t(key, WA_MSG[key] || "", vars))}`, target: "_blank", rel: "noopener" }
    : { href: "#contact" };

/* JSON for <script type="application/ld+json"> (escape "<" so it can't close the tag) */
export const jsonLd = (v) => JSON.stringify(v).replace(/</g, "\u003c");
