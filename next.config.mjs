import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  // The HTML templates are read from disk at runtime; make sure they ship with the server build.
  outputFileTracingIncludes: { "/**": ["./templates/**"] },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      // The default content and the page script change with every update: always revalidate them.
      { source: "/content.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      { source: "/site.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
