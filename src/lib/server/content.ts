import "server-only";
import { cache } from "react";
import { query, queryOne } from "./db";
import * as seed from "@/data/seed";
import seedProjects from "@/data/projects.json";

// ---------- Types ----------
export type ServiceT = {
  id: number;
  slug: string;
  title: string;
  category: string;
  icon: string;
  short: string;
  description: string;
  features: string[];
  process: string[];
  image: string | null;
  sort: number;
};
export type ProjectT = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  client: string;
  year: string;
  role: string;
  summary: string;
  overview: string[];
  highlights: { title: string; text: string }[];
  tools: string[];
  url: string;
  cover: string | null;
  gallery: string[];
  featured: boolean;
  sort: number;
};
export type TestimonialT = { id: number; name: string; role: string; quote: string; avatar: string; rating: number };
export type PostT = { id: number; slug: string; title: string; category: string; excerpt: string; content: string; cover: string; published_at: string };
export type PlanT = { id: number; name: string; price: number; suffix: string; tagline: string; features: string[]; highlighted: boolean; cta: string };
export type FaqT = { id: number; question: string; answer: string };
export type BrandT = { id: number; name: string; logo: string; url: string; kind: string };

export type Settings = {
  branding: { siteName: string; shortName: string; tagline: string; logoLight: string; logoDark: string; accent: string; favicon: string };
  hero: { badge: string; title: string; words: string[]; subtitle: string; primaryCta: string; secondaryCta: string };
  stats: { label: string; value: number; suffix: string }[];
  contact: { email: string; phone: string; whatsapp: string; address: string; hours: string; mapEmbed: string };
  social: Record<string, string>;
  seo: { title: string; description: string; keywords: string; ogImage: string };
  founder: { name: string; role: string; photo: string; bio: string; cv: string; portfolio: string };
  conversion: { whatsappButton: boolean; stickyCta: boolean; leadNotify: boolean; payNowOnDesktop: boolean; payNowOnMobile: boolean; announcement: string };
  login: { googleLogin: boolean };
};

/** Google sign-in is offered only when the admin switch is on AND the OAuth keys are set. */
export async function googleLoginOn() {
  const s = await getSettings();
  return s.login?.googleLogin !== false && Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// ---------- Helpers ----------
const arr = <T,>(v: unknown, d: T[] = []): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : d;
    } catch {
      return d;
    }
  }
  return d;
};
const bool = (v: unknown) => v === 1 || v === true || v === "1";

async function safe<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[content] DB unavailable, using seed:", (e as Error).message);
    return fallback();
  }
}

type Row = Record<string, unknown>;
const toService = (r: Row): ServiceT => ({
  id: Number(r.id),
  slug: String(r.slug),
  title: String(r.title),
  category: String(r.category),
  icon: String(r.icon || "Sparkles"),
  short: String(r.short ?? ""),
  description: String(r.description ?? ""),
  features: arr<string>(r.features),
  process: arr<string>(r.process),
  image: (r.image as string) || null,
  sort: Number(r.sort ?? 0),
});
const toProject = (r: Row): ProjectT => ({
  id: Number(r.id),
  slug: String(r.slug),
  title: String(r.title),
  tagline: String(r.tagline ?? ""),
  category: String(r.category),
  client: String(r.client ?? ""),
  year: String(r.year ?? ""),
  role: String(r.role ?? ""),
  summary: String(r.summary ?? ""),
  overview: arr<string>(r.overview),
  highlights: arr<{ title: string; text: string }>(r.highlights),
  tools: arr<string>(r.tools),
  url: String(r.url ?? ""),
  cover: (r.cover as string) || null,
  gallery: arr<string>(r.gallery),
  featured: bool(r.featured),
  sort: Number(r.sort ?? 0),
});

// ---------- Queries (React-cached per request) ----------
export const getServices = cache(() =>
  safe(
    async () => (await query("SELECT * FROM services WHERE published=1 ORDER BY sort, id")).map(toService),
    () => seed.services.map((s, i) => toService({ ...s, id: i + 1 } as unknown as Row)),
  ),
);
export const getService = cache(async (slug: string) => (await getServices()).find((s) => s.slug === slug) ?? null);

export const getProjects = cache(() =>
  safe(
    async () => (await query("SELECT * FROM projects WHERE published=1 ORDER BY featured DESC, sort, id")).map(toProject),
    () => (seedProjects as Row[]).map((p, i) => toProject({ ...p, id: i + 1 })),
  ),
);
export const getProject = cache(async (slug: string) => (await getProjects()).find((p) => p.slug === slug) ?? null);

export const getTestimonials = cache(() =>
  safe(
    async () =>
      (await query("SELECT id,name,role,quote,avatar,rating FROM testimonials WHERE published=1 ORDER BY sort, id")).map((r) => ({
        ...(r as unknown as TestimonialT),
        rating: Number(r.rating),
      })),
    () => seed.testimonials.map((t, i) => ({ ...t, id: i + 1 })),
  ),
);

export const getPosts = cache(() =>
  safe(
    async () => await query<PostT>("SELECT id,slug,title,category,excerpt,content,cover,published_at FROM posts WHERE published=1 ORDER BY published_at DESC, id DESC"),
    () => seed.posts.map((p, i) => ({ ...p, id: i + 1 })),
  ),
);
export const getPost = cache(async (slug: string) => (await getPosts()).find((p) => p.slug === slug) ?? null);

export const getPlans = cache(() =>
  safe(
    async () =>
      (await query("SELECT * FROM plans WHERE published=1 ORDER BY sort, id")).map(
        (r): PlanT => ({
          id: Number(r.id),
          name: String(r.name),
          price: Number(r.price),
          suffix: String(r.suffix ?? ""),
          tagline: String(r.tagline ?? ""),
          features: arr<string>(r.features),
          highlighted: bool(r.highlighted),
          cta: String(r.cta ?? "Get started"),
        }),
      ),
    () => seed.plans.map((p, i) => ({ ...p, id: i + 1 })),
  ),
);

export const getFaqs = cache(() =>
  safe(
    async () => await query<FaqT>("SELECT id,question,answer FROM faqs WHERE published=1 ORDER BY sort, id"),
    () => seed.faqs.map((f, i) => ({ ...f, id: i + 1 })),
  ),
);

export const getBrands = cache(() =>
  safe(
    async () => await query<BrandT>("SELECT id,name,logo,url,kind FROM brands WHERE published=1 ORDER BY sort, id"),
    () => seed.brands.map((b, i) => ({ ...b, id: i + 1 })),
  ),
);

export const getSettings = cache(() =>
  safe(
    async () => {
      const rows = await query<{ k: string; v: unknown }>("SELECT k, v FROM settings");
      const out = structuredClone(seed.settings) as Record<string, unknown>;
      for (const { k, v } of rows) {
        if (k === "integrations") continue; // secrets never go to public pages
        const val = typeof v === "string" ? JSON.parse(v) : v;
        out[k] = Array.isArray(val) ? val : { ...(out[k] as object), ...(val as object) };
      }
      return out as unknown as Settings;
    },
    () => seed.settings as unknown as Settings,
  ),
);

export async function getSetting<K extends keyof Settings>(k: K): Promise<Settings[K]> {
  return (await getSettings())[k];
}

export { queryOne };
