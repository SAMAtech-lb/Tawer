import { fileURLToPath } from "node:url";

const dev = process.env.NODE_ENV !== "production";

/* What the browser may load on this site. Everything is served from this site itself (fonts are bundled by
 * next/font, icons by the remixicon package), except the photos from Unsplash. Next's own small inline scripts
 * need 'unsafe-inline'; the dev server also needs eval and a websocket for live reload. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  poweredByHeader: false,
  // One "page not found" page for the whole app (it has two root layouts: the website and the dashboard).
  experimental: { globalNotFound: true },
  // <Image> asks Unsplash's CDN for each size directly (lib/image-loader.js), so photos get a srcset and AVIF/WebP
  // without our server resizing anything.
  images: { loader: "custom", loaderFile: "./lib/image-loader.js" },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // HTTPS only (production only, so the local http://localhost dev server keeps working).
          ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
      // The dashboard: never indexed by Google, never cached.
      ...["/admin", "/admin/:path*"].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      })),
    ];
  },
};

export default nextConfig;
