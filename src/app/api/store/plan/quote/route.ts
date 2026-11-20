import { requireStoreApi } from "@/lib/server/store-auth";
import { quotePlan } from "@/lib/server/plan-billing";

/** Live price breakdown for the upgrade screen (plan × years − coupon + GST). */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const q = await quotePlan(a.user.id, b.plan, b.years, b.coupon);
  if ("error" in q) return Response.json(q, { status: 422 });
  return Response.json({ ok: true, quote: q });
}
