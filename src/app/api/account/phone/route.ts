import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { exec, queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { sendOtpSms } from "@/lib/server/sms";
import { consumeToken, createToken, getUser, normPhone, publicUser, type User } from "@/lib/server/users";

/**
 * Add / verify the signed-in user's mobile number with an OTP.
 *  { action: "send", phone }          → SMS a 6-digit code
 *  { action: "verify", phone, code }  → attach the number to this account
 * If the number belongs to an empty "silent" account (made by an earlier phone order), its orders and
 * payments move into this account — the OTP proves the person owns that number.
 */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = normPhone(b.phone);
  if (!phone) return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 422 });
  if (u.phone === phone) return Response.json({ ok: true, user: publicUser(u) });

  const other = await queryOne<User & { status: string }>("SELECT * FROM users WHERE phone=? AND id<>?", [phone, u.id]);
  const otherStore = other ? await queryOne("SELECT id FROM stores WHERE user_id=?", [other.id]) : null;
  const mergeable = other && !other.password_hash && !other.email && !(other as User & { google_sub?: string }).google_sub && !otherStore;
  if (other && !mergeable) return Response.json({ error: "This number already has its own account. Log in with it using OTP, or use another number." }, { status: 409 });

  if (b.action === "send") {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`phoneotp:${ip}`, 6) || !rateLimit(`phoneotp:${phone}`, 4)) return Response.json({ error: "Too many OTP requests. Please wait a few minutes." }, { status: 429 });
    const code = String(randomInt(100000, 999999));
    const sent = await sendOtpSms(phone, code);
    if (!sent.ok) return Response.json({ error: "Could not send SMS. Please try again." }, { status: 503 });
    await createToken("otp", `verify:${phone}`, u.id, 10, code);
    return Response.json({ ok: true });
  }

  if (b.action === "verify") {
    const t = await consumeToken("otp", `verify:${phone}`, String(b.code ?? "").trim());
    if (!t || t.user_id !== u.id) return Response.json({ error: "Wrong or expired code." }, { status: 422 });
    if (other) {
      // Merge the empty phone account into this one.
      await exec("UPDATE store_orders SET customer_id=? WHERE customer_id=?", [u.id, other.id]);
      await exec("UPDATE payments SET user_id=? WHERE user_id=?", [u.id, other.id]);
      await exec("UPDATE users SET phone=NULL, status='merged', session_ver=session_ver+1 WHERE id=?", [other.id]);
    }
    await exec("UPDATE users SET phone=? WHERE id=?", [phone, u.id]);
    if (!u.name && other?.name) await exec("UPDATE users SET name=? WHERE id=?", [other.name, u.id]);
    return Response.json({ ok: true, user: publicUser({ ...u, phone }), merged: Boolean(other) });
  }
  return Response.json({ error: "Bad request." }, { status: 400 });
}
