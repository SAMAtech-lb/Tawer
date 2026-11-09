import { readStored, fmt, plain, getPath } from "./_shared/lib.js";

const BACKSLASH = String.fromCharCode(92);
const UNSAFE_JSON_CHARS =new RegExp("[<" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

/* GET /  — serves index.html with the admin's saved content applied on the server, so visitors,
 * search engines and link previews (WhatsApp, Facebook…) see the latest text immediately.
 * Lists (courses, FAQ, …) are rendered by site.js from the injected window.TAWER_CONTENT. */
export async function onRequestGet({ request, env, next }) {
  // The page depends on the saved content, not only on index.html, so the static file's ETag can't be
  // used for caching: drop the browser's "has it changed?" headers so we always get the full file
  // (otherwise the browser gets "304 Not Modified" and keeps showing an old copy).
  const assetHeaders = new Headers(request.headers);
  ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "if-range"].forEach((h) => assetHeaders.delete(h));
  const res = await next(new Request(request.url, { method: "GET", headers: assetHeaders }));
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;

  let stored = null;
  try { stored = await readStored(env); } catch { /* fall back to the default content */ }
  const content = stored?.content;
  if (!content) return noValidators(res);

  const seo = content.seo || {};
  // Escape "<" (so the JSON can't close the <script> tag) and the U+2028/U+2029 line separators.
  const data = JSON.stringify(content).replace(UNSAFE_JSON_CHARS, (ch) => BACKSLASH + "u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));

  const setMeta = (value) => ({ element(el) { if (typeof value === "string") el.setAttribute("content", plain(value)); } });

  const out = new HTMLRewriter()
    .on("head", { element(el) { el.append(`<script>window.TAWER_CONTENT=${data};</script>`, { html: true }); } })
    .on("title", { element(el) { if (typeof seo.title === "string") el.setInnerContent(plain(seo.title)); } })
    .on('meta[name="description"]', setMeta(seo.description))
    .on('meta[property="og:title"]', setMeta(seo.shareTitle))
    .on('meta[property="og:description"]', setMeta(seo.shareDescription))
    .on("[data-c]", {
      element(el) {
        const v = getPath(content, el.getAttribute("data-c"));
        if (typeof v === "string" || typeof v === "number") el.setInnerContent(fmt(v, el.getAttribute("data-hl") || ""), { html: true });
      },
    })
    .on("[data-cn]", {
      element(el) {
        const v = getPath(content, el.getAttribute("data-cn"));
        if (v !== undefined && v !== null) el.setAttribute("data-count", String(+v || 0));
      },
    })
    .transform(res);

  return noValidators(out);
}

/* Always re-download the page: no ETag / Last-Modified, and don't reuse a stored copy. */
function noValidators(res) {
  const headers = new Headers(res.headers);
  headers.delete("etag");
  headers.delete("last-modified");
  headers.set("cache-control", "no-store");
  return new Response(res.body, { status: res.status, headers });
}
