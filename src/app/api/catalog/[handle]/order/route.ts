import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { exec, query } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { getStoreByHandle, hydrateProduct } from "@/lib/server/catalog";
import { findOrCreateUser, normEmail, normPhone } from "@/lib/server/users";
import { sendMail } from "@/lib/server/mail";
import { siteUrl } from "@/lib/site";
import { str } from "@/lib/server/store-auth";

type Line = { id: number; variant?: string; qty: number };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Customer places an order on a merchant's store (COD or UPI with UTR). Prices always come from the database. */
export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`order:${store.id}:${ip}`, 10)) return Response.json({ error: "Too many orders. Please try again later." }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 120);
  const phone = normPhone(b.phone);
  const email = b.email ? normEmail(b.email) : null;
  const address = str(b.address, 600);
  const method = b.pay_method === "upi" ? "upi" : b.pay_method === "cod" ? "cod" : null;
  const utr = str(b.utr, 40).replace(/\s/g, "");
  if (name.length < 2) return Response.json({ error: "Enter your name." }, { status: 422 });
  if (!phone) return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 422 });
  if (b.email && !email) return Response.json({ error: "Enter a valid email or leave it empty." }, { status: 422 });
  if (address.length < 10) return Response.json({ error: "Enter your full delivery address." }, { status: 422 });
  if (!method || (method === "cod" && !store.payments.cod) || (method === "upi" && !store.payments.upi.on)) return Response.json({ error: "Choose an available payment method." }, { status: 422 });
  if (method === "upi" && !/^[A-Za-z0-9]{8,30}$/.test(utr)) return Response.json({ error: "Enter the UTR / transaction ID from your UPI app (12 digits usually)." }, { status: 422 });

  const lines = (Array.isArray(b.items) ? (b.items as Line[]) : []).filter((l) => Number.isInteger(Number(l?.id)) && Number(l?.qty) > 0).slice(0, 50);
  if (!lines.length) return Response.json({ error: "Your cart is empty." }, { status: 422 });
  const ids = [...new Set(lines.map((l) => Number(l.id)))];
  const rows = (await query<Record<string, unknown>>(`SELECT * FROM store_products WHERE store_id=? AND status='active' AND id IN (${ids.map(() => "?").join(",")})`, [store.id, ...ids])).map(hydrateProduct);

  const items: { id: number; name: string; variant: string | null; price: number; qty: number }[] = [];
  for (const l of lines) {
    const p = rows.find((r) => r.id === Number(l.id));
    if (!p) return Response.json({ error: "Some items are no longer available. Please refresh your cart." }, { status: 409 });
    const qty = Math.min(99, Math.floor(Number(l.qty)));
    let price = p.price;
    let variant: string | null = null;
    if (p.variants.length) {
      const v = p.variants.find((x) => x.key === l.variant);
      if (!v) return Response.json({ error: `Choose an option for ${p.name}.` }, { status: 422 });
      if (v.stock != null && v.stock < qty) return Response.json({ error: `Only ${v.stock} left of ${p.name} (${v.key}).` }, { status: 409 });
      variant = v.key;
      price = v.price ?? p.price;
    } else if (p.stock != null && p.stock < qty) {
      return Response.json({ error: `Only ${p.stock} left of ${p.name}.` }, { status: 409 });
    }
    items.push({ id: p.id, name: p.name, variant, price, qty });
  }
  const subtotal = Math.round(items.reduce((n, i) => n + i.price * i.qty, 0) * 100) / 100;

  // Customers get a silent account so they can later log in and see their orders (and open their own store).
  const customer = await findOrCreateUser({ name, phone, email, source: "store" });
  const orderNo = `${store.code.slice(-4)}${Date.now().toString(36).toUpperCase().slice(-5)}${randomInt(10, 99)}`;
  await exec(
    "INSERT INTO store_orders (store_id, order_no, customer_id, name, phone, email, address, items, subtotal, pay_method, utr, pay_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [store.id, orderNo, customer.id, name, phone, email, address, JSON.stringify(items), subtotal, method, method === "upi" ? utr : null, "pending"],
  );
  // Stock goes down when the order is placed.
  for (const i of items) {
    if (i.variant) {
      const p = rows.find((r) => r.id === i.id)!;
      const variants = p.variants.map((v) => (v.key === i.variant && v.stock != null ? { ...v, stock: Math.max(0, v.stock - i.qty) } : v));
      await exec("UPDATE store_products SET variants=? WHERE id=?", [JSON.stringify(variants), i.id]);
    } else {
      await exec("UPDATE store_products SET stock=GREATEST(0, stock-?) WHERE id=? AND stock IS NOT NULL", [i.qty, i.id]);
    }
  }

  after(async () => {
    const to = store.contact.email;
    if (!to) return;
    const list = items.map((i) => `<tr><td style="padding:6px 0">${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ""} × ${i.qty}</td><td style="text-align:right">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`).join("");
    await sendMail({
      to,
      subject: `🛍️ New order ${orderNo} — ₹${subtotal.toLocaleString("en-IN")} (${method.toUpperCase()})`,
      text: `New order ${orderNo} from ${name} (${phone}). Total ₹${subtotal}. Payment: ${method}${utr ? ` UTR ${utr}` : ""}. Open your dashboard: ${siteUrl()}/account/store?tab=orders`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:20px 24px"><div style="font-size:12px;letter-spacing:2px;color:#f5c542">${esc(store.name)}</div><div style="font-size:20px;font-weight:700;margin-top:4px">New order ${orderNo}</div></div><div style="padding:20px 24px;font-size:14px;color:#222"><p><b>${esc(name)}</b> · ${esc(phone)}${email ? ` · ${esc(email)}` : ""}<br>${esc(address)}</p><table style="width:100%;border-collapse:collapse">${list}<tr><td style="padding-top:10px;font-weight:700">Total</td><td style="text-align:right;padding-top:10px;font-weight:700">₹${subtotal.toLocaleString("en-IN")}</td></tr></table><p>Payment: <b>${method === "cod" ? "Cash on delivery" : `UPI — UTR ${esc(utr)} (please verify)`}</b></p><p><a href="${siteUrl()}/account/store?tab=orders" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">Open orders</a></p></div></div>`,
    }).catch(() => {});
  });

  return Response.json({ ok: true, orderNo, subtotal });
}
