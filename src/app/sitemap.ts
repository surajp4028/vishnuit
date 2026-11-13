import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/server/content";
import { siteUrl } from "@/lib/site";

const SITE = siteUrl();
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([getServices(), getProjects(), getPosts()]);
  const now = new Date();
  return [
    ...["", "/about", "/services", "/portfolio", "/pricing", "/blog", "/contact"].map((p) => ({ url: `${SITE}${p}`, lastModified: now, priority: p ? 0.8 : 1 })),
    ...services.map((s) => ({ url: `${SITE}/services/${s.slug}`, lastModified: now, priority: 0.7 })),
    ...projects.map((p) => ({ url: `${SITE}/portfolio/${p.slug}`, lastModified: now, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.published_at), priority: 0.6 })),
  ];
}
