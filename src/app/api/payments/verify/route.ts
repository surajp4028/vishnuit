import { fetchPayment, verifyCheckoutSignature } from "@/lib/server/razorpay";
import { markPaid } from "@/lib/server/payments";
import { exec } from "@/lib/server/db";
import { invoicePath } from "@/lib/server/invoice";

export async function POST(req: Request) {
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = await req.json().catch(() => ({}));
  if (typeof o !== "string" || typeof p !== "string" || typeof s !== "string") return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (!verifyCheckoutSignature(o, p, s)) {
    await exec("UPDATE payments SET status='failed' WHERE rzp_order_id=? AND status='created'", [o]).catch(() => {});
    return Response.json({ error: "Payment verification failed." }, { status: 400 });
  }
  const pay = await fetchPayment(p);
  await markPaid(o, p, pay?.method ?? null, s);
  return Response.json({ ok: true, invoiceUrl: invoicePath(o) });
}
