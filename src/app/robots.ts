import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
const SITE = siteUrl();
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/thank-you"] }], sitemap: `${SITE}/sitemap.xml` };
}
