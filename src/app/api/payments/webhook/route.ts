import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { markPaid } from "@/lib/server/payments";
import { exec } from "@/lib/server/db";

// Configure in Razorpay Dashboard → Webhooks: URL /api/payments/webhook, events payment.captured & payment.failed
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) return new Response("bad signature", { status: 400 });
  const evt = JSON.parse(raw);
  const pay = evt?.payload?.payment?.entity;
  if (pay?.order_id) {
    if (evt.event === "payment.captured" || evt.event === "order.paid") await markPaid(pay.order_id, pay.id, pay.method ?? null, null);
    if (evt.event === "payment.failed") await exec("UPDATE payments SET status='failed' WHERE rzp_order_id=? AND status='created'", [pay.order_id]);
  }
  return Response.json({ ok: true });
}
