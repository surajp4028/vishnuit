import "server-only";
import { exec, query, queryOne } from "@/lib/server/db";
import { normEmail, normPhone } from "@/lib/server/users";

/** What the admin sees about an account (no password hash / google sub values). */
export type AdminAccount = {
  id: number; uid: string; name: string; email: string | null; phone: string | null; status: string; source: string;
  google: boolean; hasPassword: boolean; created_at: string; last_login: string | null;
};

export async function getAccount(id: number): Promise<AdminAccount | null> {
  const u = await queryOne<{
    id: number; uid: string; name: string; email: string | null; phone: string | null; status: string; source: string;
    google: number; has_password: number; created_at: string; last_login: string | null;
  }>(
    `SELECT id, uid, name, email, phone, status, source, (google_sub IS NOT NULL) google, (password_hash IS NOT NULL) has_password, created_at, last_login
     FROM users WHERE id=?`, [id]);
  if (!u) return null;
  const { has_password, google, ...rest } = u;
  return { ...rest, google: Boolean(Number(google)), hasPassword: Boolean(Number(has_password)) };
}

type Other = { id: number; uid: string; name: string };
const label = (o: Other) => `#${o.id} · ${o.uid} · ${o.name || "(no name)"}`;

/**
 * Admin edit of an account's name / email / phone. Refuses (with the other account's #id · VISHNU id · name)
 * when the email or phone already belongs to someone else. Returns an error string, or null when saved.
 */
export async function updateAccount(id: number, b: { name?: unknown; email?: unknown; phone?: unknown }): Promise<{ error: string; status: number } | null> {
  const cur = await queryOne<{ email: string | null; phone: string | null; google_sub: string | null }>("SELECT email, phone, google_sub FROM users WHERE id=?", [id]);
  if (!cur) return { error: "User not found", status: 404 };
  const sets: string[] = [];
  const vals: unknown[] = [];
  let email = cur.email;
  let phone = cur.phone;

  if (b.name !== undefined) {
    const name = String(b.name ?? "").trim().slice(0, 120);
    if (!name) return { error: "Name can't be empty.", status: 422 };
    sets.push("name=?"); vals.push(name);
  }
  if (b.email !== undefined) {
    const raw = String(b.email ?? "").trim();
    email = raw ? normEmail(raw) : null;
    // A Google account keeps its Google email; unlink Google first (Reset Google link), then the email can change.
    if (cur.google_sub && email !== cur.email) return { error: "This account signs in with Google, so its email can't be changed. Reset the Google link first.", status: 409 };
    if (raw && !email) return { error: "Enter a valid email address.", status: 422 };
    if (email && email !== cur.email) {
      const o = await queryOne<Other>("SELECT id, uid, name FROM users WHERE email=? AND id<>?", [email, id]);
      if (o) return { error: `This email is already used by ${label(o)}`, status: 409 };
    }
    sets.push("email=?"); vals.push(email);
  }
  if (b.phone !== undefined) {
    const raw = String(b.phone ?? "").trim();
    phone = raw ? normPhone(raw) : null;
    if (raw && !phone) return { error: "Enter a valid mobile number (10-digit Indian or +country code).", status: 422 };
    if (phone && phone !== cur.phone) {
      const o = await queryOne<Other>("SELECT id, uid, name FROM users WHERE phone=? AND id<>?", [phone, id]);
      if (o) return { error: `This phone number is already used by ${label(o)}`, status: 409 };
    }
    sets.push("phone=?"); vals.push(phone);
  }
  if (!email && !phone) return { error: "Keep at least an email or a phone number, otherwise the user can't log in.", status: 422 };
  if (!sets.length) return null;
  try {
    await exec(`UPDATE users SET ${sets.join(", ")} WHERE id=?`, [...vals, id]);
  } catch (e) {
    // Lost a race with another sign-up — re-check to name the account.
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      const o = await queryOne<Other>("SELECT id, uid, name FROM users WHERE (email=? OR phone=?) AND id<>?", [email, phone, id]);
      return { error: o ? `This email or phone is already used by ${label(o)}` : "This email or phone is already in use.", status: 409 };
    }
    throw e;
  }
  return null;
}

/** Unlink Google: the account becomes a normal email / phone login (OTP or password reset). */
export async function resetGoogle(id: number) {
  const r = await exec("UPDATE users SET google_sub=NULL WHERE id=?", [id]);
  return r.affectedRows > 0;
}

const n = (v: unknown) => Number(v ?? 0);

/** Catalog plan payments (Razorpay subscriptions) made by a user. */
export async function planPayments(userId: number) {
  const r = await queryOne<{ c: number; total: number; last: string | null }>(
    "SELECT COUNT(*) c, COALESCE(SUM(amount),0) total, MAX(COALESCE(paid_at, created_at)) last FROM payments WHERE user_id=? AND kind='subscription' AND status='paid'",
    [userId]);
  return { count: n(r?.c), total: n(r?.total), last: r?.last ?? null };
}

/** Order volume of one store. GMV = sum of order totals excluding cancelled orders. */
export async function storeVolume(storeId: number) {
  const r = await queryOne<Record<string, unknown>>(
    `SELECT COUNT(*) orders, COALESCE(SUM(status='delivered'),0) delivered, COALESCE(SUM(pay_status IN ('paid','verified')),0) paid,
            COALESCE(SUM(status='cancelled'),0) cancelled, COALESCE(SUM(CASE WHEN status<>'cancelled' THEN subtotal ELSE 0 END),0) gmv,
            MIN(created_at) first_order, MAX(created_at) last_order
     FROM store_orders WHERE store_id=?`, [storeId]);
  return {
    orders: n(r?.orders), delivered: n(r?.delivered), paid: n(r?.paid), cancelled: n(r?.cancelled), gmv: n(r?.gmv),
    firstOrder: (r?.first_order as string | null) ?? null, lastOrder: (r?.last_order as string | null) ?? null,
  };
}

/** Everything a user did with us: stores owned, orders placed as a shopper, payments to Vishnu IT. */
export async function userVolume(userId: number) {
  const [stores, cust, svc, plan] = await Promise.all([
    query<{ id: number; name: string; handle: string; code: string; plan: string; plan_expires_at: string | null; status: string; orders: number; gmv: number }>(
      `SELECT s.id, s.name, s.handle, s.code, s.plan, s.plan_expires_at, s.status,
         (SELECT COUNT(*) FROM store_orders o WHERE o.store_id=s.id) orders,
         (SELECT COALESCE(SUM(subtotal),0) FROM store_orders o WHERE o.store_id=s.id AND o.status<>'cancelled') gmv
       FROM stores s WHERE s.user_id=?`, [userId]),
    queryOne<Record<string, unknown>>(
      `SELECT COUNT(*) orders, COALESCE(SUM(CASE WHEN status<>'cancelled' THEN subtotal ELSE 0 END),0) spend, MAX(created_at) last_order
       FROM store_orders WHERE customer_id=?`, [userId]),
    queryOne<Record<string, unknown>>(
      "SELECT COUNT(*) c, COALESCE(SUM(amount),0) total FROM payments WHERE user_id=? AND kind<>'subscription' AND status='paid'", [userId]),
    planPayments(userId),
  ]);
  return {
    stores: stores.map((s) => ({ ...s, orders: n(s.orders), gmv: n(s.gmv) })),
    customer: { orders: n(cust?.orders), spend: n(cust?.spend), lastOrder: (cust?.last_order as string | null) ?? null },
    servicePayments: { count: n(svc?.c), total: n(svc?.total) },
    planPayments: plan,
  };
}
