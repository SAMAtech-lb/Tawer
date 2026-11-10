/* /robots.txt: everyone (search engines and AI assistants) may read the website; the dashboard and the API are
 * private. Points to the sitemap. */
import { SITE_URL } from "@/lib/seo";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
