import "server-only";
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exec, queryOne } from "./db";

export type User = {
  id: number; uid: string; name: string; email: string | null; phone: string | null;
  password_hash: string | null; avatar_key: string | null; company: string | null; session_ver: number; created_at: string;
  google_sub?: string | null;
};

const COOKIE = "vit_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return s;
}
const sign = (p: string) => createHmac("sha256", secret()).update(`user:${p}`).digest("base64url");

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function checkPassword(pw: string, stored: string | null) {
  if (!stored) return false;
  const [algo, salt, hex] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hex) return false;
  const a = Buffer.from(hex, "hex");
  const b = scryptSync(pw, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const sha = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

/** Indian mobile → +91XXXXXXXXXX; other +countrycode numbers kept as-is. */
export function normPhone(v: unknown) {
  const d = String(v ?? "").replace(/[^\d+]/g, "");
  const ten = d.replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(ten)) return `+91${ten}`;
  if (/^\+\d{8,15}$/.test(d)) return d;
  return null;
}
export const normEmail = (v: unknown) => {
  const e = String(v ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 190 ? e : null;
};

async function newUid() {
  for (let i = 0; i < 8; i++) {
    const uid = `VISHNU${randomInt(100000, 999999)}`;
    if (!(await queryOne("SELECT id FROM users WHERE uid=?", [uid]))) return uid;
  }
  return `VISHNU${Date.now().toString().slice(-8)}`;
}

/**
 * Find a user by phone (preferred) or email, or create one silently (no password yet).
 * Used by Pay Now, plan checkout and later the catalog stores. Never overwrites existing data.
 */
export async function findOrCreateUser(input: { name?: string; email?: string | null; phone?: string | null; company?: string; source: string }) {
  const phone = input.phone ? normPhone(input.phone) : null;
  const email = input.email ? normEmail(input.email) : null;
  let u = phone ? await queryOne<User>("SELECT * FROM users WHERE phone=?", [phone]) : null;
  if (!u && email) u = await queryOne<User>("SELECT * FROM users WHERE email=?", [email]);
  if (u) {
    // Never attach a new email/phone to an existing account from an unauthenticated form:
    // someone could type a victim's phone with their own email and then reset the password.
    if (!u.name && input.name) {
      await exec("UPDATE users SET name=? WHERE id=?", [input.name.slice(0, 120), u.id]);
      u.name = input.name.slice(0, 120);
    }
    return u;
  }
  const uid = await newUid();
  // A public form can't prove the email belongs to the phone's owner, so a phone-based silent
  // account starts without the email (it's still kept on the order/payment and can be added after OTP).
  const r = await exec("INSERT INTO users (uid,name,email,phone,company,source) VALUES (?,?,?,?,?,?)", [
    uid, (input.name ?? "").slice(0, 120), phone ? null : email, phone, input.company?.slice(0, 190) || null, input.source,
  ]);
  return (await queryOne<User>("SELECT * FROM users WHERE id=?", [r.insertId]))!;
}

/* ---------- session ---------- */
export async function startSession(u: Pick<User, "id" | "session_ver">) {
  const payload = Buffer.from(JSON.stringify({ i: u.id, v: u.session_ver, x: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
  await exec("UPDATE users SET last_login=NOW() WHERE id=?", [u.id]).catch(() => {});
}
export async function endSession() {
  (await cookies()).delete(COOKIE);
}
export async function getUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const want = sign(payload);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString()) as { i: number; v: number; x: number };
    if (d.x < Date.now()) return null;
    const u = await queryOne<User>("SELECT * FROM users WHERE id=? AND status='active'", [d.i]);
    return u && u.session_ver === d.v ? u : null;
  } catch {
    return null;
  }
}
export async function requireUser(next = "/account") {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

/** Safe shape for the browser. */
export const publicUser = (u: User) => ({
  uid: u.uid, name: u.name, email: u.email, phone: u.phone, company: u.company,
  avatar: u.avatar_key ? `/api/account/avatar/${u.uid}?v=${encodeURIComponent(u.avatar_key.split("/").pop() ?? "")}` : null,
  hasPassword: Boolean(u.password_hash),
  google: Boolean(u.google_sub),
});
export type PublicUser = ReturnType<typeof publicUser>;

/* ---------- one-time codes (password-reset links & OTP) ---------- */
export async function createToken(kind: "reset" | "otp" | "handoff", target: string, userId: number | null, minutes: number, code: string) {
  await exec("UPDATE user_tokens SET used_at=NOW() WHERE target=? AND kind=? AND used_at IS NULL", [target, kind]);
  await exec("INSERT INTO user_tokens (user_id,kind,target,code_hash,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? MINUTE))", [userId, kind, target, sha(code), minutes]);
}
export async function consumeToken(kind: "reset" | "otp" | "handoff", target: string, code: string) {
  const t = await queryOne<{ id: number; user_id: number | null; code_hash: string; attempts: number }>(
    "SELECT id,user_id,code_hash,attempts FROM user_tokens WHERE target=? AND kind=? AND used_at IS NULL AND expires_at>NOW() ORDER BY id DESC LIMIT 1",
    [target, kind],
  );
  if (!t) return null;
  // Count the attempt first (atomically), so parallel guesses can't slip past the limit.
  const tried = await exec("UPDATE user_tokens SET attempts=attempts+1 WHERE id=? AND attempts<5 AND used_at IS NULL", [t.id]);
  if (!tried.affectedRows || t.code_hash !== sha(code)) return null;
  const used = await exec("UPDATE user_tokens SET used_at=NOW() WHERE id=? AND used_at IS NULL", [t.id]);
  return used.affectedRows ? t : null;
}
