/* next/image loader (images.loaderFile in next.config.mjs). The photos come from Unsplash, whose CDN resizes and
 * converts them (AVIF/WebP) itself, so the browser asks it directly for the size it needs. Nothing is resized on
 * our server. Any other image is used as it is. */
export default function imageLoader({ src, width, quality }) {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality || 75));
  return url.href;
}
