import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/server/content";
import { LANDING_PAGES } from "@/data/landing-pages";
import { siteUrl } from "@/lib/site";
import { query } from "@/lib/server/db";
import { getCatalogConfig } from "@/lib/server/catalog";

const SITE = siteUrl();
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([getServices(), getProjects(), getPosts()]);
  const now = new Date();
  // Live catalog stores (each also has its own /catalog/@handle/sitemap.xml with every product).
  const stores = (await getCatalogConfig()).features.storefronts ? await query<{ handle: string }>("SELECT handle FROM stores WHERE status='active'").catch(() => []) : [];
  return [
    ...["", "/about", "/services", "/portfolio", "/pricing", "/blog", "/contact"].map((p) => ({ url: `${SITE}${p}`, lastModified: now, priority: p ? 0.8 : 1 })),
    ...LANDING_PAGES.map((l) => ({ url: `${SITE}/${l.slug}`, lastModified: now, priority: 0.9 })),
    ...services.map((s) => ({ url: `${SITE}/services/${s.slug}`, lastModified: now, priority: 0.7 })),
    ...projects.map((p) => ({ url: `${SITE}/portfolio/${p.slug}`, lastModified: now, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.published_at), priority: 0.6 })),
    ...stores.map((st) => ({ url: `${SITE}/catalog/@${st.handle}`, lastModified: now, priority: 0.7 })),
  ];
}
