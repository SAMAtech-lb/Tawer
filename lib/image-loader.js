/* next/image loader (images.loaderFile in next.config.mjs). The photos come from Unsplash, whose CDN resizes and
 * converts them (AVIF/WebP) itself, so the browser asks it directly for the size it needs. Nothing is resized on
 * our server. Any other image is used as it is. The width asked for in U(id, w) is the photo's largest useful size:
 * never ask for more than twice that (sharp on retina screens), so a 46px avatar never offers a 3840px file. */
export default function imageLoader({ src, width, quality }) {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  const max = 2 * (Number(url.searchParams.get("w")) || 1200);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(Math.min(width, max)));
  url.searchParams.set("q", String(quality || 75));
  return url.href;
}
