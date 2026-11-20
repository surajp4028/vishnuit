import { revalidatePath } from "next/cache";
import { isCatalogKey } from "@/lib/server/s3";
import { exec } from "@/lib/server/db";
import { PAGE_KEYS, effectivePlan, encryptSecret, getCatalogConfig, getStoreForUser, storeForOwner, type StorePages, type StorePayments, type StoreTax, type StoreTestimonials, type StoreFront, HIGHLIGHT_ICONS, type HighlightIcon } from "@/lib/server/catalog";
import { requireStoreApi, str } from "@/lib/server/store-auth";

/** Social links must be real https URLs (blocks javascript: and other schemes). */
const httpsOnly = (u: string) => (/^https:\/\/[^\s/]+\.[^\s]+$/i.test(u) ? u : u && !u.includes(":") && !u.startsWith("/") ? `https://${u.replace(/^\/+/, "")}` : "");

/** Save store profile, contact, policy pages and payment methods. */
export async function PATCH(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownKey = (k: unknown) => k === null || isCatalogKey(k, store.code);

  const name = b.name !== undefined ? str(b.name, 120) : store.name;
  if (name.length < 2) return Response.json({ error: "Enter your store name." }, { status: 422 });
  const tagline = b.tagline !== undefined ? str(b.tagline, 200) : store.tagline;
  const about = b.about !== undefined ? str(b.about, 8000) : store.about;
  const logo = b.logo_key !== undefined ? (ownKey(b.logo_key) ? (b.logo_key as string | null) : store.logo_key) : store.logo_key;
  const banner = b.banner_key !== undefined ? (ownKey(b.banner_key) ? (b.banner_key as string | null) : store.banner_key) : store.banner_key;

  const c = (b.contact ?? {}) as Record<string, unknown>;
  const contact = b.contact ? {
    phone: str(c.phone, 20), whatsapp: str(c.whatsapp, 20).replace(/\D/g, ""), email: str(c.email, 190),
    address: str(c.address, 400), instagram: httpsOnly(str(c.instagram, 200)), facebook: httpsOnly(str(c.facebook, 200)),
    youtube: httpsOnly(str(c.youtube, 200)), pinterest: httpsOnly(str(c.pinterest, 200)), x: httpsOnly(str(c.x, 200)),
  } : store.contact;

  let pages: StorePages = store.pages;
  if (b.pages) {
    const p = b.pages as Record<string, { on?: unknown; content?: unknown }>;
    pages = { ...store.pages };
    for (const k of PAGE_KEYS) if (p[k]) pages[k] = { on: Boolean(p[k].on), content: str(p[k].content, 20000) };
  }

  let payments: StorePayments = store.payments;
  if (b.payments) {
    const p = b.payments as { cod?: unknown; upi?: { on?: unknown; vpa?: unknown; qr_key?: unknown }; razorpay?: { on?: unknown; key_id?: unknown; key_secret?: unknown } };
    const vpa = str(p.upi?.vpa, 80);
    if (vpa && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(vpa)) return Response.json({ error: "Enter a valid UPI ID like name@okhdfcbank." }, { status: 422 });
    const allowRzp = (await getCatalogConfig()).plans[effectivePlan(store)].razorpay;
    const keyId = str(p.razorpay?.key_id, 60);
    const secret = str(p.razorpay?.key_secret, 80);
    if (p.razorpay?.on && !allowRzp) return Response.json({ error: "Razorpay checkout needs the Starter plan or higher." }, { status: 403 });
    if (keyId && !/^rzp_(live|test)_\w{8,}$/.test(keyId)) return Response.json({ error: "Razorpay Key ID looks wrong (starts with rzp_live_ or rzp_test_)." }, { status: 422 });
    payments = {
      cod: Boolean(p.cod),
      upi: { on: Boolean(p.upi?.on) && Boolean(vpa || p.upi?.qr_key || store.payments.upi.qr_key), vpa, qr_key: p.upi?.qr_key !== undefined ? (ownKey(p.upi.qr_key) ? (p.upi.qr_key as string | null) : store.payments.upi.qr_key) : store.payments.upi.qr_key },
      razorpay: { on: allowRzp && Boolean(p.razorpay?.on) && Boolean(keyId), key_id: keyId, secret_enc: secret ? encryptSecret(secret) : store.payments.razorpay.secret_enc },
    };
    if (!payments.cod && !payments.upi.on && !payments.razorpay.on) return Response.json({ error: "Keep at least one payment method on." }, { status: 422 });
  }

  let tax: StoreTax = store.tax;
  if (b.tax) {
    const t = b.tax as Record<string, unknown>;
    const gstin = str(t.gstin, 15).toUpperCase();
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return Response.json({ error: "GSTIN looks wrong — 15 characters like 07ABCDE1234F1Z5." }, { status: 422 });
    const rate = Number(t.rate);
    if (![0, 3, 5, 12, 18, 28].includes(rate)) return Response.json({ error: "Choose a GST rate: 0, 3, 5, 12, 18 or 28%." }, { status: 422 });
    tax = { gstin, legalName: str(t.legalName, 120), rate, inclusive: t.inclusive !== false, hsn: str(t.hsn, 12), invoicePrefix: (str(t.invoicePrefix, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "INV") };
  }

  let testimonials: StoreTestimonials = store.testimonials;
  if (b.testimonials) {
    const t = b.testimonials as { on?: unknown; items?: unknown };
    const raw = Array.isArray(t.items) ? (t.items as Record<string, unknown>[]).slice(0, 30) : [];
    const items = raw
      .map((x, i) => ({ id: str(x.id, 24) || `t${Date.now().toString(36)}${i}`, name: str(x.name, 60), place: str(x.place, 60), text: str(x.text, 600), rating: Math.min(5, Math.max(1, Math.round(Number(x.rating) || 5))), on: x.on !== false }))
      .filter((x) => x.name || x.text);
    if (items.some((x) => !x.name || x.text.length < 5)) return Response.json({ error: "Each testimonial needs a customer name and a few words of review." }, { status: 422 });
    testimonials = { on: Boolean(t.on), items };
  }

  let storefront: StoreFront = store.storefront;
  if (b.storefront) {
    const f = b.storefront as Record<string, unknown>;
    const linkOk = (l: string) => !l || (l.startsWith("/") && !l.startsWith("//") && !l.includes("\\")) || /^https?:\/\/[^\s]+$/.test(l);
    const banners = (Array.isArray(f.banners) ? (f.banners as Record<string, unknown>[]) : []).slice(0, 10).filter((x) => ownKey(x.key) && x.key).map((x, i) => ({
      id: str(x.id, 24) || `b${Date.now().toString(36)}${i}`, key: String(x.key), title: str(x.title, 80), subtitle: str(x.subtitle, 160), cta: str(x.cta, 30), link: str(x.link, 300),
    }));
    const px = (f.pixels ?? {}) as Record<string, unknown>;
    if (px.meta && !/^\d{10,20}$/.test(String(px.meta).replace(/\D/g, ""))) return Response.json({ error: "Meta Pixel ID should be 15–16 digits." }, { status: 422 });
    if (px.ga && !/^G-[A-Z0-9]{4,15}$/i.test(String(px.ga))) return Response.json({ error: "Google Analytics ID looks like G-XXXXXXXXXX." }, { status: 422 });
    if (banners.some((x) => !linkOk(x.link))) return Response.json({ error: "Banner link must start with / or https://" }, { status: 422 });
    const bar = (f.bar ?? {}) as { on?: unknown; items?: unknown };
    const hl = (Array.isArray(f.highlights) ? (f.highlights as Record<string, unknown>[]) : []).slice(0, 4).map((x) => ({
      icon: (HIGHLIGHT_ICONS as readonly string[]).includes(String(x.icon)) ? (x.icon as HighlightIcon) : "badge" as HighlightIcon,
      title: str(x.title, 40), sub: str(x.sub, 60), on: x.on !== false,
    }));
    const map = (f.map ?? {}) as { on?: unknown; query?: unknown; zoom?: unknown };
    storefront = {
      banners, interval: Math.min(15, Math.max(2, Math.round(Number(f.interval) || 5))),
      bar: { on: Boolean(bar.on), items: (Array.isArray(bar.items) ? bar.items : []).map((x) => str(x, 120)).filter(Boolean).slice(0, 6) },
      highlights: hl.length ? hl : store.storefront.highlights,
      map: { on: map.on !== false, query: str(map.query, 300), zoom: Math.min(20, Math.max(3, Math.round(Number(map.zoom) || 15))) },
      look: f.look === "minimal" || f.look === "soft" ? f.look : "sharp",
      shipping: (() => { const x = (f.shipping ?? {}) as Record<string, unknown>; const n = (v: unknown) => Math.min(1_000_000, Math.max(0, Math.round((Number(v) || 0) * 100) / 100)); return { cod: n(x.cod), upi: n(x.upi), razorpay: n(x.razorpay), freeAbove: n(x.freeAbove), minOrder: n(x.minOrder) }; })(),
      closed: (() => { const x = (f.closed ?? {}) as Record<string, unknown>; return { on: Boolean(x.on), message: str(x.message, 200) }; })(),
      favicon: f.favicon && ownKey(f.favicon) ? String(f.favicon) : null,
      pixels: (() => { const x = (f.pixels ?? {}) as Record<string, unknown>; return { meta: str(x.meta, 20).replace(/\D/g, ""), ga: str(x.ga, 20).toUpperCase() }; })(),
      about: (() => { const a = (f.about ?? {}) as { images?: unknown; heading?: unknown }; return { images: (Array.isArray(a.images) ? a.images : []).filter((k) => k && ownKey(k)).slice(0, 2).map(String), heading: str(a.heading, 120) }; })(),
    };
  }

  // Delivery tab saves only the delivery rules (doesn't touch banners etc.).
  if (b.shipping && !b.storefront) {
    const x = b.shipping as Record<string, unknown>;
    const n = (v: unknown) => Math.min(1_000_000, Math.max(0, Math.round((Number(v) || 0) * 100) / 100));
    storefront = { ...storefront, shipping: { cod: n(x.cod), upi: n(x.upi), razorpay: n(x.razorpay), freeAbove: n(x.freeAbove), minOrder: n(x.minOrder) } };
  }

  await exec("UPDATE stores SET name=?, tagline=?, about=?, logo_key=?, banner_key=?, contact=?, pages=?, payments=?, tax=?, testimonials=?, storefront=? WHERE id=?", [
    name, tagline || null, about || null, logo, banner, JSON.stringify(contact), JSON.stringify(pages), JSON.stringify(payments), JSON.stringify(tax), JSON.stringify(testimonials), JSON.stringify(storefront), store.id,
  ]);
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  const fresh = await getStoreForUser(store.user_id);
  return Response.json({ ok: true, store: storeForOwner(fresh!, (await getCatalogConfig()).plans) });
}
