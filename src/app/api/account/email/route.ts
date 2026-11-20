import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { exec, queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { sendMail } from "@/lib/server/mail";
import { consumeToken, createToken, getUser, normEmail, publicUser } from "@/lib/server/users";

/**
 * Change the signed-in user's email — only after a code sent to the NEW address is confirmed.
 * Google-linked accounts keep their Google email.
 *  { action: "send", email } · { action: "verify", email, code }
 */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  if (u.google_sub) return Response.json({ error: "This account is linked with Google, so its email can't be changed here." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(b.email);
  if (!email) return Response.json({ error: "Enter a valid email." }, { status: 422 });
  if (email === u.email) return Response.json({ ok: true, user: publicUser(u) });
  if (await queryOne("SELECT id FROM users WHERE email=? AND id<>?", [email, u.id])) return Response.json({ error: "This email is used by another account." }, { status: 409 });

  if (b.action === "send") {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`emailotp:${ip}`, 6) || !rateLimit(`emailotp:${email}`, 4)) return Response.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
    const code = String(randomInt(100000, 999999));
    const sent = await sendMail({
      to: email,
      subject: `${code} — confirm your new email for Vishnu IT Solutions`,
      text: `Your code is ${code}. It is valid for 10 minutes. If you didn't ask to change your email, ignore this message.`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:20px 24px;font-size:18px;font-weight:700">Confirm your new email</div><div style="padding:24px;font-size:14px;color:#333"><p>Use this code to confirm this email on your Vishnu IT account:</p><p style="font-size:34px;font-weight:800;letter-spacing:10px;margin:18px 0;color:#0a0f1f">${code}</p><p style="color:#667;font-size:12px">Valid for 10 minutes. If you didn't ask for this, ignore this email.</p></div></div>`,
    });
    if (!sent.ok) {
      if (process.env.NODE_ENV !== "production") console.log(`[mail:dev] email-change code for ${email}: ${code}`);
      else return Response.json({ error: "Could not send the email. Please try again." }, { status: 503 });
    }
    await createToken("otp", `email:${email}`, u.id, 10, code);
    return Response.json({ ok: true });
  }
  if (b.action === "verify") {
    const t = await consumeToken("otp", `email:${email}`, String(b.code ?? "").trim());
    if (!t || t.user_id !== u.id) return Response.json({ error: "Wrong or expired code." }, { status: 422 });
    await exec("UPDATE users SET email=? WHERE id=?", [email, u.id]);
    return Response.json({ ok: true, user: publicUser({ ...u, email }) });
  }
  return Response.json({ error: "Bad request." }, { status: 400 });
}
