/* Text formatting shared by the server. Must match the helpers in public/site.js.
 * [[word]] = highlight span, **word** = bold, new line = <br />. Everything else is escaped. */
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const fmt = (s, hl = "") =>
  esc(s)
    .replace(/\[\[(.+?)\]\]/g, `<span${hl ? ` class="${esc(hl)}"` : ""}>$1</span>`)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br />");

export const plain = (s) => String(s ?? "").replace(/\[\[|\]\]|\*\*/g, "");

export const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/* Saved content over defaults (same as merge() in public/site.js): objects merge, anything else is replaced. */
const isPlainObj = (v) => v && typeof v === "object" && !Array.isArray(v);
export const merge = (d, s) => {
  if (s === undefined || s === null) return d;
  if (!isPlainObj(d) || !isPlainObj(s)) return s;
  const out = { ...d };
  for (const k of Object.keys(s)) out[k] = merge(d[k], s[k]);
  return out;
};

/* Applies a translation (content.ar) over the English content. Must match translate() in public/site.js.
 * - Structure always comes from English: list length/order, numbers, images, links, true/false.
 * - Text: the translated string if it isn't empty, otherwise the English one (so nothing shows blank).
 * - Lists are matched by position (item 1 with item 1, …). */
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
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
