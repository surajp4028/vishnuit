import "server-only";
import { cache } from "react";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { query, queryOne } from "./db";

/* ---------------- plans (admin can edit prices/limits in Admin → Catalog Stores) ---------------- */
export type PlanKey = "free" | "starter" | "growth" | "premium";
export type PlanDef = { name: string; limit: number | null; price: number; razorpay: boolean };
export const PLAN_KEYS: PlanKey[] = ["free", "starter", "growth", "premium"];
export const DEFAULT_PLANS: Record<PlanKey, PlanDef> = {
  free: { name: "Free", limit: 15, price: 0, razorpay: false },
  starter: { name: "Starter", limit: 50, price: 499, razorpay: true },
  growth: { name: "Growth", limit: 100, price: 899, razorpay: true },
  premium: { name: "Premium", limit: null, price: 9999, razorpay: true },
};
/** Back-compat alias used for plan names. */
export const PLANS = DEFAULT_PLANS;
export const GRACE_DAYS = 15;

export type CatalogFeatures = {
  enabled: boolean;      // master switch for the whole catalog feature
  newStores: boolean;    // users may create new stores
  storefronts: boolean;  // merchant stores are visible to shoppers
  accountCard: boolean;  // "Launch your own online store" card on /account
  accountTab: boolean;   // "My Store / Create Store" tab on /account
  menuLink: boolean;     // "My store" in the header profile menu
};
export const DEFAULT_FEATURES: CatalogFeatures = { enabled: true, newStores: true, storefronts: true, accountCard: true, accountTab: true, menuLink: true };
export type CatalogConfig = { plans: Record<PlanKey, PlanDef>; gstRate: number; sellerGstin: string; sellerLegalName: string; features: CatalogFeatures };
export const getCatalogConfig = cache(async (): Promise<CatalogConfig> => {
  let db: Partial<CatalogConfig> = {};
  try {
    const row = await queryOne<{ v: unknown }>("SELECT v FROM settings WHERE k='catalog'");
    if (row) db = (typeof row.v === "string" ? JSON.parse(row.v) : row.v) as Partial<CatalogConfig>;
  } catch {}
  const plans = { ...DEFAULT_PLANS };
  for (const k of PLAN_KEYS) if (db.plans?.[k]) plans[k] = { ...DEFAULT_PLANS[k], ...db.plans[k] };
  plans.free.price = 0;
  plans.free.razorpay = false;
  const features = { ...DEFAULT_FEATURES, ...(db.features ?? {}) };
  if (!features.enabled) Object.assign(features, { newStores: false, accountCard: false, accountTab: false, menuLink: false });
  return { plans, gstRate: Number.isFinite(Number(db.gstRate)) ? Number(db.gstRate) : 18, sellerGstin: db.sellerGstin ?? "", sellerLegalName: db.sellerLegalName ?? "", features, rawFeatures: { ...DEFAULT_FEATURES, ...(db.features ?? {}) } } as CatalogConfig & { rawFeatures: CatalogFeatures };
});

/* ---------------- types ---------------- */
export type StoreContact = { phone?: string; whatsapp?: string; email?: string; address?: string; instagram?: string; facebook?: string };
export type StorePage = { on: boolean; content: string };
export type StorePages = { privacy: StorePage; terms: StorePage; refund: StorePage; shipping: StorePage };
export type StoreTax = { gstin: string; legalName: string; rate: number; inclusive: boolean; hsn: string; invoicePrefix: string };
export const emptyTax = (): StoreTax => ({ gstin: "", legalName: "", rate: 0, inclusive: true, hsn: "", invoicePrefix: "INV" });
export type Testimonial = { id: string; name: string; place: string; text: string; rating: number; on: boolean };
export type StoreTestimonials = { on: boolean; items: Testimonial[] };
export const emptyTestimonials = (): StoreTestimonials => ({ on: false, items: [] });
export type StorePayments = { cod: boolean; upi: { on: boolean; vpa: string; qr_key: string | null }; razorpay: { on: boolean; key_id: string; secret_enc: string | null } };
export type Store = {
  id: number; user_id: number; code: string; handle: string; name: string; tagline: string | null;
  logo_key: string | null; banner_key: string | null; about: string | null;
  contact: StoreContact; pages: StorePages; payments: StorePayments; tax: StoreTax; testimonials: StoreTestimonials;
  plan: PlanKey; plan_expires_at: string | null; status: string; created_at: string;
};
export type Product = {
  id: number; store_id: number; category_id: number | null; name: string; slug: string; description: string | null;
  price: number; compare_price: number | null; sku: string | null; stock: number | null; images: string[];
  options: { name: string; values: string[] }[]; variants: { key: string; price: number | null; stock: number | null }[];
  status: "active" | "draft"; featured: boolean; created_at: string;
};
export type Category = { id: number; store_id: number; name: string; slug: string; sort: number };

export const PAGE_KEYS = ["privacy", "terms", "refund", "shipping"] as const;
export const PAGE_TITLES: Record<(typeof PAGE_KEYS)[number], string> = {
  privacy: "Privacy Policy", terms: "Terms & Conditions", refund: "Refund & Exchange Policy", shipping: "Shipping Policy",
};
const emptyPages = (): StorePages => ({ privacy: { on: false, content: "" }, terms: { on: false, content: "" }, refund: { on: false, content: "" }, shipping: { on: false, content: "" } });
const emptyPayments = (): StorePayments => ({ cod: true, upi: { on: false, vpa: "", qr_key: null }, razorpay: { on: false, key_id: "", secret_enc: null } });

const json = <T,>(v: unknown, fallback: T): T => {
  if (v == null) return fallback;
  if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return fallback; } }
  return v as T;
};

export function hydrateStore(r: Record<string, unknown>): Store {
  const pages = { ...emptyPages(), ...json<Partial<StorePages>>(r.pages, {}) };
  const pay = json<Partial<StorePayments>>(r.payments, {});
  return {
    ...(r as unknown as Store),
    contact: json<StoreContact>(r.contact, {}),
    tax: { ...emptyTax(), ...json<Partial<StoreTax>>(r.tax, {}) },
    testimonials: { ...emptyTestimonials(), ...json<Partial<StoreTestimonials>>(r.testimonials, {}) },
    pages,
    payments: { ...emptyPayments(), ...pay, upi: { ...emptyPayments().upi, ...(pay.upi ?? {}) }, razorpay: { ...emptyPayments().razorpay, ...(pay.razorpay ?? {}) } },
    created_at: String(r.created_at),
    plan_expires_at: r.plan_expires_at ? String(r.plan_expires_at) : null,
  };
}
export function hydrateProduct(r: Record<string, unknown>): Product {
  return {
    ...(r as unknown as Product),
    price: Number(r.price), compare_price: r.compare_price == null ? null : Number(r.compare_price),
    stock: r.stock == null ? null : Number(r.stock),
    images: json<string[]>(r.images, []), options: json(r.options, []), variants: json(r.variants, []),
    featured: Boolean(Number(r.featured)), created_at: String(r.created_at),
  };
}

/** Plan in force: a paid plan stays active until expiry + 15-day grace, then the store falls back to Free limits. */
export function effectivePlan(s: Pick<Store, "plan" | "plan_expires_at">): PlanKey {
  if (s.plan === "free" || !s.plan_expires_at) return s.plan === "free" ? "free" : s.plan;
  const end = new Date(s.plan_expires_at).getTime() + GRACE_DAYS * 86400000;
  return Date.now() <= end ? s.plan : "free";
}
/** Max products for the plan in force (Infinity = unlimited). */
export const productLimit = (s: Pick<Store, "plan" | "plan_expires_at">, plans: Record<PlanKey, PlanDef>) => plans[effectivePlan(s)].limit ?? Infinity;

/* ---------------- lookups ---------------- */
export async function getStoreForUser(userId: number) {
  const r = await queryOne<Record<string, unknown>>("SELECT * FROM stores WHERE user_id=?", [userId]);
  return r ? hydrateStore(r) : null;
}
export const getStoreByHandle = cache(async (raw: string) => {
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();
  if (!HANDLE_RE.test(handle)) return null;
  const cfg = await getCatalogConfig();
  if (!cfg.features.enabled || !cfg.features.storefronts) return null;
  const r = await queryOne<Record<string, unknown>>("SELECT * FROM stores WHERE handle=? AND status='active'", [handle]);
  return r ? hydrateStore(r) : null;
});
export const getStoreCategories = cache(async (storeId: number) =>
  query<Category>("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [storeId]));
export async function getStoreProducts(storeId: number, opts: { activeOnly?: boolean; categoryId?: number; featured?: boolean; limit?: number; q?: string } = {}) {
  const where = ["store_id=?"];
  const p: unknown[] = [storeId];
  if (opts.activeOnly) where.push("status='active'");
  if (opts.categoryId) { where.push("category_id=?"); p.push(opts.categoryId); }
  if (opts.featured) where.push("featured=1");
  if (opts.q?.trim()) { where.push("(name LIKE ? OR description LIKE ?)"); p.push(`%${opts.q.trim().slice(0, 60)}%`, `%${opts.q.trim().slice(0, 60)}%`); }
  const rows = await query<Record<string, unknown>>(`SELECT * FROM store_products WHERE ${where.join(" AND ")} ORDER BY featured DESC, id DESC LIMIT ${Math.min(opts.limit ?? 500, 1000)}`, p);
  return rows.map(hydrateProduct);
}

/* ---------------- handles & slugs ---------------- */
export const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const RESERVED = new Set(["admin", "api", "account", "catalog", "vishnu", "vishnuit", "login", "register", "store", "shop", "cart", "checkout", "support", "help", "www", "site"]);
export function handleProblem(h: string) {
  if (!HANDLE_RE.test(h)) return "Use 3–30 letters, numbers, - or _ (start with a letter or number).";
  if (RESERVED.has(h)) return "This name is reserved. Try another.";
  return null;
}
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "item";

/* ---------------- images ---------------- */
/** Public URL for a catalog image (proxied to a signed S3 link so the bucket stays private). */
export const imgUrl = (key: string | null | undefined) => (key ? `/api/catalog/img?k=${encodeURIComponent(key)}` : null);
export const catalogKey = (code: string, kind: string, ext = "webp") => `catalog/${code}/${kind}/${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`;

/* ---------------- secrets (merchant Razorpay key) ---------------- */
const encKey = () => createHash("sha256").update(`store-secrets:${process.env.AUTH_SECRET ?? ""}`).digest();
export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}
export function decryptSecret(enc: string | null) {
  if (!enc) return null;
  try {
    const b = Buffer.from(enc, "base64");
    const d = createDecipheriv("aes-256-gcm", encKey(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Store shape that is safe to send to the merchant's browser (no secrets). */
export function storeForOwner(s: Store, plans: Record<PlanKey, PlanDef>) {
  const plan = effectivePlan(s);
  return {
    id: s.id, code: s.code, handle: s.handle, name: s.name, tagline: s.tagline ?? "", about: s.about ?? "",
    logo: imgUrl(s.logo_key), logo_key: s.logo_key, banner: imgUrl(s.banner_key), banner_key: s.banner_key,
    contact: s.contact, pages: s.pages, tax: s.tax, testimonials: s.testimonials,
    payments: { cod: s.payments.cod, upi: { ...s.payments.upi, qr: imgUrl(s.payments.upi.qr_key) }, razorpay: { on: s.payments.razorpay.on, key_id: s.payments.razorpay.key_id, hasSecret: Boolean(s.payments.razorpay.secret_enc) } },
    plan: s.plan, effectivePlan: plan, planName: plans[plan].name, limit: plans[plan].limit,
    plan_expires_at: s.plan_expires_at, razorpayAllowed: plans[plan].razorpay,
    inGrace: s.plan !== "free" && plan !== "free" && !!s.plan_expires_at && new Date(s.plan_expires_at).getTime() < Date.now(),
  };
}
export type OwnerStore = ReturnType<typeof storeForOwner>;

/** GST split for an order total under the store's tax settings. */
export function orderTax(total: number, tax: StoreTax) {
  const rate = tax.gstin && tax.rate > 0 ? tax.rate : 0;
  if (!rate) return { rate: 0, taxable: total, gst: 0, total };
  const taxable = tax.inclusive ? Math.round((total / (1 + rate / 100)) * 100) / 100 : total;
  const gst = tax.inclusive ? Math.round((total - taxable) * 100) / 100 : Math.round(((total * rate) / 100) * 100) / 100;
  return { rate, taxable, gst, total: tax.inclusive ? total : Math.round((total + gst) * 100) / 100 };
}
