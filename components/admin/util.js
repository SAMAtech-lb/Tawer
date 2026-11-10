/* Helpers for the dashboard (client side). merge (saved over defaults) is the website's own, so both agree. */
import { isObj, merge } from "@/lib/format";
import { plain } from "@/lib/site-helpers";

export { merge, plain };
export const clone = (o) => structuredClone(o);
export const getP = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
export const setP = (o, p, v) => {
  const ks = p.split("."), last = ks.pop();
  const t = ks.reduce((x, k) => (isObj(x[k]) ? x[k] : (x[k] = {})), o);
  t[last] = v;
};

/* Text fields are translated (English | Arabic side by side) unless marked { tr: false }. */
export const translatable = (def) => def.tr !== false && ["text", "textarea", "lines"].includes(def.type);

/* The Arabic part of the content (content.ar), same shape as English, text only. */
export const arRoot = (content) => (isObj(content.ar) ? content.ar : (content.ar = {}));
/* Arabic list at the same path, kept the same length/order as the English one. */
export const arList = (content, p) => {
  let a = getP(arRoot(content), p);
  if (!Array.isArray(a)) { a = []; setP(arRoot(content), p, a); }
  return a;
};
export const arItem = (content, p, i) => { const a = arList(content, p); if (!isObj(a[i])) a[i] = {}; return a[i]; };

/* How many filled-in English texts in a section have no Arabic yet (badge on the section tab). */
export function missingArabic(tab, content) {
  let n = 0;
  const check = (def, en, ar) => {
    if (!translatable(def)) return;
    const e = getP(en, def.k), a = ar ? getP(ar, def.k) : undefined;
    if (def.type === "lines") (Array.isArray(e) ? e : []).forEach((x, i) => { if (String(x).trim() && !String((Array.isArray(a) ? a[i] : "") ?? "").trim()) n++; });
    else if (String(e ?? "").trim() && !String(a ?? "").trim()) n++;
  };
  for (const c of tab.cards) {
    if (c.list) {
      const tr = getP(content.ar || {}, c.list.p) || [];
      (getP(content, c.list.p) || []).forEach((item, i) => c.list.fields.forEach((f) => check(f, item, tr[i])));
    } else c.fields.forEach((f) => check(f, content, content.ar || {}));
  }
  return n;
}

/* JSON request to our API; throws an Error with .status on failure. */
export async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  let data = null;
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!data) throw Object.assign(new Error("The server didn't respond correctly. Please try again."), { status: res.status });
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), { status: res.status });
  return data;
}
