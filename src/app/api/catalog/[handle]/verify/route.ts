import { exec, queryOne } from "@/lib/server/db";
import { decryptSecret, getStoreByHandle } from "@/lib/server/catalog";
import { verifyCheckoutSignature } from "@/lib/server/razorpay";
import { restock } from "@/lib/server/stock";

/**
 * Confirms a shopper's Razorpay payment using the merchant's own key secret.
 * Only a still-pending, not-cancelled order can change; a failed payment gives the stock back.
 */
export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const secret = decryptSecret(store.payments.razorpay.secret_enc);
  const o = await queryOne<{ id: number; items: unknown; pay_status: string; status: string }>("SELECT id, items, pay_status, status FROM store_orders WHERE store_id=? AND rzp_order_id=?", [store.id, String(b.razorpay_order_id ?? "")]);
  if (!o || !secret) return Response.json({ error: "Order not found." }, { status: 404 });
  if (o.pay_status === "paid") return Response.json({ ok: true });
  if (o.pay_status !== "pending" || o.status === "cancelled") return Response.json({ error: "This order can't be paid any more." }, { status: 409 });
  if (!verifyCheckoutSignature(String(b.razorpay_order_id), String(b.razorpay_payment_id ?? ""), String(b.razorpay_signature ?? ""), secret)) {
    return Response.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  await exec("UPDATE store_orders SET pay_status='paid', utr=? WHERE id=? AND pay_status='pending'", [String(b.razorpay_payment_id).slice(0, 40), o.id]);
  return Response.json({ ok: true });
}

/** Shopper closed the Razorpay window without paying: cancel the unpaid order and release its stock. */
export async function DELETE(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const o = await queryOne<{ id: number; items: unknown; status_log: unknown }>("SELECT id, items, status_log FROM store_orders WHERE store_id=? AND rzp_order_id=? AND pay_method='razorpay' AND pay_status='pending' AND status='new'", [store.id, String(b.razorpay_order_id ?? "")]);
  if (!o) return Response.json({ ok: true });
  const r = await exec("UPDATE store_orders SET status='cancelled', pay_status='failed' WHERE id=? AND status='new' AND pay_status='pending'", [o.id]);
  if (r.affectedRows) await restock(typeof o.items === "string" ? JSON.parse(o.items) : (o.items as never[]), store.id, 1);
  return Response.json({ ok: true });
}
