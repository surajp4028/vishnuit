import "server-only";
import { exec, queryOne } from "./db";
import { getCatalogConfig, type PlanKey, PLAN_KEYS } from "./catalog";

export type Coupon = { id: number; code: string; kind: "percent" | "flat"; value: number; user_id: number | null; plan: string | null; max_uses: number | null; used: number; valid_till: string | null; active: number };
export type Quote = {
  plan: PlanKey; planName: string; years: number; unit: number; base: number; discount: number; coupon: string | null;
  taxable: number; gstRate: number; gst: number; total: number; limit: number | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Checks a coupon for this user/plan. Returns the coupon or an error message. */
export async function checkCoupon(code: string, userId: number, plan: PlanKey): Promise<Coupon | string> {
  const c = await queryOne<Coupon>("SELECT * FROM coupons WHERE code=?", [code.trim().toUpperCase()]);
  if (!c || !Number(c.active)) return "This coupon is not valid.";
  if (c.valid_till && new Date(`${String(c.valid_till).slice(0, 10)}T23:59:59+05:30`).getTime() < Date.now()) return "This coupon has expired.";
  if (c.max_uses != null && Number(c.used) >= Number(c.max_uses)) return "This coupon has been fully used.";
  if (c.user_id && Number(c.user_id) !== userId) return "This coupon is not for your account.";
  if (c.plan && c.plan !== plan) return `This coupon only works on the ${c.plan} plan.`;
  return { ...c, value: Number(c.value) };
}

/** Price for a paid plan × years, minus coupon, plus GST (admin-set rate, default 18%). */
export async function quotePlan(userId: number, plan: string, yearsIn: unknown, couponCode?: string): Promise<Quote | { error: string }> {
  const cfg = await getCatalogConfig();
  if (!PLAN_KEYS.includes(plan as PlanKey) || plan === "free") return { error: "Choose a paid plan." };
  const years = Math.floor(Number(yearsIn));
  if (!(years >= 1 && years <= 4)) return { error: "Choose 1 to 4 years." };
  const p = cfg.plans[plan as PlanKey];
  const base = r2(p.price * years);
  let discount = 0;
  let coupon: string | null = null;
  if (couponCode?.trim()) {
    const c = await checkCoupon(couponCode, userId, plan as PlanKey);
    if (typeof c === "string") return { error: c };
    discount = r2(Math.min(base, c.kind === "flat" ? c.value : (base * c.value) / 100));
    coupon = c.code;
  }
  const taxable = r2(base - discount);
  const gst = r2((taxable * cfg.gstRate) / 100);
  return { plan: plan as PlanKey, planName: p.name, years, unit: p.price, base, discount, coupon, taxable, gstRate: cfg.gstRate, gst, total: r2(taxable + gst), limit: p.limit };
}

/**
 * Called once when a subscription payment is marked paid (checkout verify or webhook).
 * Renewing the same plan before it ends adds years on top; a different plan starts today.
 */
export async function activateSubscription(paymentId: number) {
  const p = await queryOne<{ id: number; kind: string; meta: unknown }>("SELECT id, kind, meta FROM payments WHERE id=?", [paymentId]);
  if (!p || p.kind !== "subscription") return;
  const m = (typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta) as { store_id: number; plan: PlanKey; years: number; coupon: string | null; applied?: boolean };
  if (!m?.store_id || m.applied) return;
  const s = await queryOne<{ plan: string; plan_expires_at: string | null }>("SELECT plan, plan_expires_at FROM stores WHERE id=?", [m.store_id]);
  if (!s) return;
  const now = Date.now();
  const current = s.plan_expires_at ? new Date(s.plan_expires_at).getTime() : 0;
  const start = s.plan === m.plan && current > now ? new Date(current) : new Date(now);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + m.years);
  await exec("UPDATE stores SET plan=?, plan_expires_at=?, reminder_sent_at=NULL WHERE id=?", [m.plan, end, m.store_id]);
  if (m.coupon) await exec("UPDATE coupons SET used=used+1 WHERE code=?", [m.coupon]);
  await exec("UPDATE payments SET meta=JSON_SET(meta, '$.applied', true, '$.starts', ?, '$.ends', ?) WHERE id=?", [start.toISOString(), end.toISOString(), paymentId]);
}
