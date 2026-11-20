import { exec, queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { createOrder, rzpConfigured } from "@/lib/server/razorpay";
import { requireStoreApi } from "@/lib/server/store-auth";
import { quotePlan } from "@/lib/server/plan-billing";

/** Starts a Razorpay payment for a catalog plan. The plan switches on in markPaid() once Razorpay confirms. */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  if (!rzpConfigured()) return Response.json({ error: "Online payments are not configured yet." }, { status: 503 });
  if (!rateLimit(`planorder:${a.user.id}`, 10)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const q = await quotePlan(a.user.id, b.plan, b.years, b.coupon);
  if ("error" in q) return Response.json(q, { status: 422 });
  const { user, store } = a;
  // Limited coupons: count payments started in the last 30 minutes too, so one code can't be opened many times at once.
  if (q.coupon) {
    const c = await queryOne<{ max_uses: number | null; used: number }>("SELECT max_uses, used FROM coupons WHERE code=?", [q.coupon]);
    if (c?.max_uses != null) {
      const open = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM payments WHERE kind='subscription' AND status<>'paid' AND created_at > NOW() - INTERVAL 30 MINUTE AND JSON_UNQUOTE(JSON_EXTRACT(meta, '$.coupon'))=?", [q.coupon]);
      if (Number(c.used) + Number(open?.n ?? 0) >= Number(c.max_uses)) return Response.json({ error: "This coupon has been fully used." }, { status: 422 });
    }
  }
  const label = `Catalog ${q.planName} plan · ${q.years} year${q.years > 1 ? "s" : ""}`;
  try {
    const order = await createOrder(Math.round(q.total * 100), `vit_plan_${store.id}_${Date.now()}`, { kind: "subscription", store: store.handle, plan: q.plan, years: String(q.years) });
    await exec(
      "INSERT INTO payments (user_id, kind, plan_id, plan_name, amount, name, email, phone, company, notes, meta, rzp_order_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [user.id, "subscription", null, label, q.total, user.name || store.name, user.email || "-", user.phone, user.company, `Store @${store.handle}`, JSON.stringify({ store_id: store.id, ...q }), order.id],
    );
    return Response.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, label, prefill: { name: user.name, email: user.email, contact: user.phone } });
  } catch (e) {
    console.error("[plan/order]", (e as Error).message);
    return Response.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
