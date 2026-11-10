/* Combining content: saved content over the defaults, and Arabic over English.
 * Used by the website (lib/site-content.js) and the dashboard (components/admin/util.js). No server-only imports. */

export const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/* Saved content over defaults: objects merge, anything else (text, numbers, lists) is replaced. */
export const merge = (d, s) => {
  if (s === undefined || s === null) return d;
  if (!isObj(d) || !isObj(s)) return s;
  const out = { ...d };
  for (const k of Object.keys(s)) out[k] = merge(d[k], s[k]);
  return out;
};

/* Arabic (content.ar) over the English content:
 * - Structure always comes from English: list length/order, numbers, images, links, true/false.
 * - Text: the Arabic string if it isn't empty, otherwise the English one (so nothing shows blank).
 * - Lists are matched by position (item 1 with item 1, …). */
export const translate = (base, tr) => {
  if (tr === undefined || tr === null) return base;
  if (Array.isArray(base)) return base.map((b, i) => translate(b, Array.isArray(tr) ? tr[i] : undefined));
  if (isObj(base)) {
    if (!isObj(tr)) return base;
    const out = { ...base };
    for (const k of Object.keys(base)) if (k !== "ar") out[k] = translate(base[k], tr[k]);
    return out;
  }
  if (typeof base === "string") return typeof tr === "string" && tr.trim() ? tr : base;
  return base;
};
