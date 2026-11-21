import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { query, transaction } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { decryptSecret, effectivePlan, getCatalogConfig, getStoreByHandle, hydrateProduct, quoteOrder } from "@/lib/server/catalog";
import { GST_STATES, stateName } from "@/lib/gst-states";
import { priceCart } from "@/lib/server/cart-pricing";
import { nextInvoiceNo } from "@/lib/server/invoice";
import { createOrder } from "@/lib/server/razorpay";
import { findOrCreateUser, getUser, normEmail, normPhone } from "@/lib/server/users";
import { sendMail } from "@/lib/server/mail";
import { siteUrl } from "@/lib/site";
import { str } from "@/lib/server/store-auth";

class StockError extends Error {}
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Customer places an order on a merchant's store (COD or UPI with UTR). Prices always come from the database. */
export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  if (store.storefront.closed.on) return Response.json({ error: store.storefront.closed.message || "This store isn't taking orders right now. Please check back soon." }, { status: 423 });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`order:${store.id}:${ip}`, 10)) return Response.json({ error: "Too many orders. Please try again later." }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 120);
  const phone = normPhone(b.phone);
  const email = b.email ? normEmail(b.email) : null;
  // Address comes as separate fields (line, landmark, city, PIN); older clients may still send one "address" box.
  const pincode = String(b.pincode ?? "").replace(/\D/g, "");
  const city = str(b.city, 80);
  const line1 = str(b.line1, 250);
  const landmark = str(b.landmark, 120);
  const split = b.line1 != null || b.pincode != null || b.city != null;
  const address = split ? `${line1}${landmark ? `, Near ${landmark}` : ""}\n${city} - ${pincode}` : str(b.address, 600);
  // Business buyers can add their GSTIN (optional) — it goes on their tax invoice, and its state decides CGST+SGST vs IGST.
  const gstinRaw = String(b.gstin ?? "").trim().toUpperCase();
  const gstin = gstinRaw || null;
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return Response.json({ error: "GSTIN looks wrong — it has 15 characters, e.g. 07ABCDE1234F1Z5. Leave it empty if you don't have one." }, { status: 422 });
  if (gstin && !GST_STATES.some(([c]) => c === gstin.slice(0, 2))) return Response.json({ error: "GSTIN state code isn't valid." }, { status: 422 });
  const company = gstin ? String(b.company ?? "").trim().slice(0, 160) || null : null;
  // Place of supply for goods = where delivery ends (Sec 10(1)(a) IGST Act) — the delivery state, not the GSTIN's state.
  const state = GST_STATES.some(([c]) => c === b.state) ? String(b.state) : null;
  const method = b.pay_method === "upi" ? "upi" : b.pay_method === "cod" ? "cod" : b.pay_method === "razorpay" ? "razorpay" : null;
  const rzpSecret = decryptSecret(store.payments.razorpay.secret_enc);
  const rzpOn = store.payments.razorpay.on && !!store.payments.razorpay.key_id && !!rzpSecret && (await getCatalogConfig()).plans[effectivePlan(store)].razorpay;
  const utr = str(b.utr, 40).replace(/\s/g, "");
  if (name.length < 2) return Response.json({ error: "Enter your name." }, { status: 422 });
  if (!phone) return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 422 });
  if (b.email && !email) return Response.json({ error: "Enter a valid email or leave it empty." }, { status: 422 });
  if (split && line1.length < 5) return Response.json({ error: "Enter your house / flat no. and street." }, { status: 422 });
  if (split && city.length < 2) return Response.json({ error: "Enter your city or town." }, { status: 422 });
  if (split && !/^[1-9]\d{5}$/.test(pincode)) return Response.json({ error: "Enter a valid 6-digit PIN code." }, { status: 422 });
  if (address.length < 10) return Response.json({ error: "Enter your full delivery address." }, { status: 422 });
  if (!state) return Response.json({ error: "Choose your state." }, { status: 422 });
  if (!method || (method === "cod" && !store.payments.cod) || (method === "upi" && !store.payments.upi.on) || (method === "razorpay" && !rzpOn)) return Response.json({ error: "Choose an available payment method." }, { status: 422 });
  if (method === "upi" && !/^[A-Za-z0-9]{8,30}$/.test(utr)) return Response.json({ error: "Enter the UTR / transaction ID from your UPI app (12 digits usually)." }, { status: 422 });

  // Prices, options and stock come from the database (same function as checkout's live quote).
  const priced = await priceCart(store, b.items);
  if ("error" in priced) return Response.json({ error: priced.error }, { status: priced.status });
  const { items, itemsTotal } = priced;
  const ids = [...new Set(items.map((i) => i.id))];
  const minOrder = store.storefront.shipping.minOrder;
  if (minOrder > 0 && itemsTotal < minOrder) return Response.json({ error: `Minimum order is ₹${minOrder.toLocaleString("en-IN")}. Add a little more to your bag.` }, { status: 422 });
  if (!(itemsTotal > 0)) return Response.json({ error: "Your cart is empty." }, { status: 422 });
  const quote = quoteOrder(items, store, state, method);
  if (method === "upi" && (await query("SELECT id FROM store_orders WHERE store_id=? AND utr=? LIMIT 1", [store.id, utr])).length) return Response.json({ error: "This UTR was already used for another order. Please check the transaction ID." }, { status: 409 });
  // `subtotal` is what the shopper actually pays (items + GST if extra + shipping).
  const subtotal = quote.total;

  // Customers get a silent account so they can later log in and see their orders (and open their own store).
  // Logged-in shoppers keep the order in their own account; guests get a silent account by phone.
  const customer = (await getUser()) ?? (await findOrCreateUser({ name, phone, email, source: "store" }));
  const orderNo = `${store.code.slice(-4)}${Date.now().toString(36).toUpperCase().slice(-5)}${randomInt(10, 99)}`;
  // Online payment goes straight to the merchant's own Razorpay account.
  let rzp: { id: string; amount: number; currency: string } | null = null;
  if (method === "razorpay") {
    try {
      rzp = await createOrder(Math.round(subtotal * 100), orderNo, { store: store.handle, order: orderNo }, { keyId: store.payments.razorpay.key_id, secret: rzpSecret! });
    } catch (e) {
      console.error("[store-order] razorpay:", (e as Error).message);
      return Response.json({ error: "Online payment is unavailable right now. Please choose another payment method." }, { status: 502 });
    }
  }
  // Insert the order and take stock in one transaction with row locks, so parallel orders can't oversell.
  let stockErr: string | null = null;
  await transaction(async (c) => {
    const [locked] = await c.query(`SELECT * FROM store_products WHERE store_id=? AND id IN (${ids.map(() => "?").join(",")}) FOR UPDATE`, [store.id, ...ids]);
    const fresh = (locked as Record<string, unknown>[]).map(hydrateProduct);
    for (const p of fresh) {
      const mine = items.filter((i) => i.id === p.id);
      if (!mine.length) continue;
      if (p.variants.length) {
        const variants = p.variants.map((v) => {
          const take = mine.filter((i) => i.variant === v.key).reduce((n, i) => n + i.qty, 0);
          return take && v.stock != null ? { ...v, stock: v.stock - take } : v;
        });
        const short = variants.find((v) => v.stock != null && v.stock < 0);
        if (short) throw new StockError(`Only ${short.stock! + mine.filter((i) => i.variant === short.key).reduce((n, i) => n + i.qty, 0)} left of ${p.name} (${short.key}).`);
        await c.execute("UPDATE store_products SET variants=? WHERE id=?", [JSON.stringify(variants), p.id]);
      } else if (p.stock != null) {
        const take = mine.reduce((n, i) => n + i.qty, 0);
        if (p.stock < take) throw new StockError(`Only ${p.stock} left of ${p.name}.`);
        await c.execute("UPDATE store_products SET stock=stock-? WHERE id=?", [take, p.id]);
      }
    }
    // Consecutive invoice number for this store & financial year, plus a copy of the seller's details as they are today,
    // so the invoice never changes if the seller later edits their GSTIN, address or prefix.
    const invoiceNo = await nextInvoiceNo(`store:${store.id}`, store.tax.invoicePrefix, new Date(), c);
    const seller = { name: store.name, legalName: store.tax.legalName, gstin: store.tax.gstin, address: store.contact.address ?? "", phone: store.contact.phone ?? "", email: store.contact.email ?? "", hsn: store.tax.hsn, rate: store.tax.rate, inclusive: store.tax.inclusive };
    await c.execute(
      "INSERT INTO store_orders (store_id, order_no, invoice_no, customer_id, name, phone, email, address, state, buyer_gstin, buyer_company, seller, items, items_total, shipping, tax, subtotal, pay_method, utr, rzp_order_id, pay_status, status_log) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [store.id, orderNo, invoiceNo, customer.id, name, phone, email, `${address}\n${stateName(state)}`, state, gstin, company, JSON.stringify(seller), JSON.stringify(items), itemsTotal, quote.shipping, JSON.stringify(quote), subtotal, method, method === "upi" ? utr : null, rzp?.id ?? null, "pending", JSON.stringify([{ s: "new", at: new Date().toISOString() }])],
    );
  }).catch((e) => { if (e instanceof StockError) stockErr = e.message; else throw e; });
  if (stockErr) return Response.json({ error: stockErr }, { status: 409 });

  after(async () => {
    const list = items.map((i) => `<tr><td style="padding:6px 0">${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ""} × ${i.qty}</td><td style="text-align:right">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`).join("");
    const extra = `${quote.shipping ? `<tr><td style="padding:6px 0;color:#666">Shipping</td><td style="text-align:right">₹${quote.shipping.toLocaleString("en-IN")}</td></tr>` : ""}${quote.gst && !quote.inclusive ? `<tr><td style="padding:6px 0;color:#666">GST @ ${quote.rate}%</td><td style="text-align:right">₹${quote.gst.toLocaleString("en-IN")}</td></tr>` : ""}`;
    const table = `<table style="width:100%;border-collapse:collapse">${list}${extra}<tr><td style="padding-top:10px;font-weight:700">Total</td><td style="text-align:right;padding-top:10px;font-weight:700">₹${subtotal.toLocaleString("en-IN")}</td></tr></table>`;
    const shell = (title: string, body: string) => `<div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:20px 24px"><div style="font-size:12px;letter-spacing:2px;color:#f5c542">${esc(store.name)}</div><div style="font-size:20px;font-weight:700;margin-top:4px">${title}</div></div><div style="padding:20px 24px;font-size:14px;color:#222">${body}</div></div>`;
    const payText = method === "cod" ? "Cash on delivery" : method === "razorpay" ? "Online (Razorpay)" : `UPI — UTR ${esc(utr)}`;
    // Merchant: new order alert (store email, or the owner's account email).
    const owner = store.contact.email || (await query<{ email: string | null }>("SELECT email FROM users WHERE id=?", [store.user_id]))[0]?.email;
    if (owner) await sendMail({
      to: owner,
      subject: `🛍️ New order ${orderNo} — ₹${subtotal.toLocaleString("en-IN")} (${method.toUpperCase()})`,
      text: `New order ${orderNo} from ${name} (${phone}). Total ₹${subtotal}. Payment: ${method}${utr ? ` UTR ${utr}` : ""}. Open your dashboard: ${siteUrl()}/seller/orders`,
      html: shell(`New order ${orderNo}`, `<p><b>${esc(name)}</b> · ${esc(phone)}${email ? ` · ${esc(email)}` : ""}<br>${esc(address)}, ${esc(stateName(state))}</p>${table}<p>Payment: <b>${payText}</b>${method === "upi" ? " (please verify)" : ""}</p><p><a href="${siteUrl()}/seller/orders" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">Open orders</a></p>`),
    }).catch(() => {});
    // Shopper: confirmation with a link to track the order.
    if (email) await sendMail({
      to: email,
      subject: `Order ${orderNo} received — ${store.name}`,
      text: `Thanks ${name}! ${store.name} received your order ${orderNo} (₹${subtotal}). Track it: ${siteUrl()}/catalog/@${store.handle}/account`,
      html: shell("Thank you for your order!", `<p>Hi ${esc(name)}, we've received your order <b>${orderNo}</b>. ${esc(store.name)} will confirm it shortly.</p>${table}<p>Payment: <b>${payText}</b><br>Deliver to: ${esc(address)}, ${esc(stateName(state))}</p><p><a href="${siteUrl()}/catalog/@${store.handle}/account" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">Track my order</a></p>`),
    }).catch(() => {});
  });

  return Response.json({ ok: true, orderNo, subtotal, ...(rzp ? { rzp: { keyId: store.payments.razorpay.key_id, orderId: rzp.id, amount: rzp.amount, currency: rzp.currency } } : {}) });
}
