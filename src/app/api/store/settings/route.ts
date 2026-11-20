import { revalidatePath } from "next/cache";
import { exec } from "@/lib/server/db";
import { PAGE_KEYS, PLANS, effectivePlan, encryptSecret, getStoreForUser, storeForOwner, type StorePages, type StorePayments } from "@/lib/server/catalog";
import { requireStoreApi, str } from "@/lib/server/store-auth";

const keyOk = (k: unknown) => k === null || (typeof k === "string" && /^catalog\/VISHNU\d{5,10}\/[a-z]+\/[\w.-]+$/.test(k));

/** Save store profile, contact, policy pages and payment methods. */
export async function PATCH(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownKey = (k: unknown) => keyOk(k) && (k === null || String(k).startsWith(`catalog/${store.code}/`));

  const name = b.name !== undefined ? str(b.name, 120) : store.name;
  if (name.length < 2) return Response.json({ error: "Enter your store name." }, { status: 422 });
  const tagline = b.tagline !== undefined ? str(b.tagline, 200) : store.tagline;
  const about = b.about !== undefined ? str(b.about, 8000) : store.about;
  const logo = b.logo_key !== undefined ? (ownKey(b.logo_key) ? (b.logo_key as string | null) : store.logo_key) : store.logo_key;
  const banner = b.banner_key !== undefined ? (ownKey(b.banner_key) ? (b.banner_key as string | null) : store.banner_key) : store.banner_key;

  const c = (b.contact ?? {}) as Record<string, unknown>;
  const contact = b.contact ? {
    phone: str(c.phone, 20), whatsapp: str(c.whatsapp, 20).replace(/\D/g, ""), email: str(c.email, 190),
    address: str(c.address, 400), instagram: str(c.instagram, 200), facebook: str(c.facebook, 200),
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
    const allowRzp = PLANS[effectivePlan(store)].razorpay;
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

  await exec("UPDATE stores SET name=?, tagline=?, about=?, logo_key=?, banner_key=?, contact=?, pages=?, payments=? WHERE id=?", [
    name, tagline || null, about || null, logo, banner, JSON.stringify(contact), JSON.stringify(pages), JSON.stringify(payments), store.id,
  ]);
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  const fresh = await getStoreForUser(store.user_id);
  return Response.json({ ok: true, store: storeForOwner(fresh!) });
}
