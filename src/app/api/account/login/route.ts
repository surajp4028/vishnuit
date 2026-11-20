import { headers } from "next/headers";
import { queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { checkPassword, normEmail, normPhone, publicUser, startSession, type User } from "@/lib/server/users";

/** Login with email OR mobile number + password. */
export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`ulogin:${ip}`, 10)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const id = String(b.id ?? "").trim();
  const email = normEmail(id);
  const phone = email ? null : normPhone(id);
  if (!email && !phone) return Response.json({ error: "Enter your email or 10-digit mobile number." }, { status: 422 });
  const u = await queryOne<User>(`SELECT * FROM users WHERE ${email ? "email" : "phone"}=? AND status='active'`, [email ?? phone]);
  if (u && !u.password_hash) return Response.json({ error: "Your account has no password yet. Use “Forgot password” or login with OTP.", code: "no_password" }, { status: 401 });
  if (!u || !checkPassword(String(b.password ?? ""), u.password_hash)) return Response.json({ error: "Wrong email/mobile or password." }, { status: 401 });
  await startSession(u);
  return Response.json({ ok: true, user: publicUser(u) });
}
