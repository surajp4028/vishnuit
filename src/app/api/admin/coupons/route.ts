import { exec, queryOne } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { PLAN_KEYS } from "@/lib/server/catalog";
import { normEmail, normPhone } from "@/lib/server/users";

/** Create a coupon. Optional: lock to one user (VISHNU ID / email / phone) and/or one plan. */
export async function POST(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const code = String(b.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return Response.json({ error: "Code: 3–40 letters/numbers (e.g. WELCOME20)." }, { status: 422 });
  if (await queryOne("SELECT id FROM coupons WHERE code=?", [code])) return Response.json({ error: "This code already exists." }, { status: 409 });
  const kind = b.kind === "flat" ? "flat" : "percent";
  const value = Number(b.value);
  if (!(value > 0) || (kind === "percent" && value > 100)) return Response.json({ error: kind === "percent" ? "Percent must be 1–100." : "Enter the discount amount." }, { status: 422 });
  let userId: number | null = null;
  const who = String(b.user ?? "").trim();
  if (who) {
    const e = normEmail(who), p = e ? null : normPhone(who);
    const u = await queryOne<{ id: number }>(/^VISHNU\d+$/i.test(who) ? "SELECT id FROM users WHERE uid=?" : e ? "SELECT id FROM users WHERE email=?" : "SELECT id FROM users WHERE phone=?", [/^VISHNU\d+$/i.test(who) ? who.toUpperCase() : e ?? p]);
    if (!u) return Response.json({ error: "No user found for that ID / email / phone." }, { status: 404 });
    userId = u.id;
  }
  const plan = b.plan && PLAN_KEYS.includes(b.plan as never) && b.plan !== "free" ? b.plan : null;
  const maxUses = b.max_uses ? Math.max(1, Math.floor(Number(b.max_uses))) : null;
  const till = /^\d{4}-\d{2}-\d{2}$/.test(String(b.valid_till ?? "")) ? b.valid_till : null;
  await exec("INSERT INTO coupons (code, kind, value, user_id, plan, max_uses, valid_till, note) VALUES (?,?,?,?,?,?,?,?)", [code, kind, value, userId, plan, maxUses, till, String(b.note ?? "").slice(0, 200) || null]);
  return Response.json({ ok: true });
}
