import { exec, queryOne } from "@/lib/server/db";
import { decryptSecret, getStoreByHandle } from "@/lib/server/catalog";
import { verifyCheckoutSignature } from "@/lib/server/razorpay";

/** Confirms a shopper's Razorpay payment using the merchant's own key secret. */
export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const secret = decryptSecret(store.payments.razorpay.secret_enc);
  const o = await queryOne<{ id: number }>("SELECT id FROM store_orders WHERE store_id=? AND rzp_order_id=?", [store.id, String(b.razorpay_order_id ?? "")]);
  if (!o || !secret) return Response.json({ error: "Order not found." }, { status: 404 });
  if (!verifyCheckoutSignature(String(b.razorpay_order_id), String(b.razorpay_payment_id ?? ""), String(b.razorpay_signature ?? ""), secret)) {
    await exec("UPDATE store_orders SET pay_status='failed' WHERE id=? AND pay_status='pending'", [o.id]);
    return Response.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  await exec("UPDATE store_orders SET pay_status='paid', utr=? WHERE id=?", [String(b.razorpay_payment_id).slice(0, 40), o.id]);
  return Response.json({ ok: true });
}
