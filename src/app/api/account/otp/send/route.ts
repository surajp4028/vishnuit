import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/server/auth";
import { sendMail } from "@/lib/server/mail";
import { sendOtpSms } from "@/lib/server/sms";
import { createToken, normEmail, normPhone } from "@/lib/server/users";

/** Sends a 6-digit login code by SMS (mobile) or email. */
export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const raw = String(b.id ?? b.phone ?? b.email ?? "").trim();
  const email = normEmail(raw);
  const phone = email ? null : normPhone(raw);
  if (!email && !phone) return Response.json({ error: "Enter your 10-digit mobile number or email." }, { status: 422 });
  const target = (email ?? phone)!;
  if (!rateLimit(`otp:${ip}`, 6) || !rateLimit(`otp:${target}`, 4)) return Response.json({ error: "Too many OTP requests. Please wait a few minutes." }, { status: 429 });

  const code = String(randomInt(100000, 999999));
  const sent = email
    ? await sendMail({
        to: email,
        subject: `${code} is your Vishnu IT Solutions login code`,
        text: `Your login code is ${code}. It is valid for 10 minutes. If you didn't try to log in, ignore this email.`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:20px 24px;font-size:18px;font-weight:700">Your login code</div><div style="padding:24px;font-size:14px;color:#333"><p>Use this code to log in to Vishnu IT Solutions:</p><p style="font-size:34px;font-weight:800;letter-spacing:10px;margin:18px 0;color:#0a0f1f">${code}</p><p style="color:#667;font-size:12px">Valid for 10 minutes. If you didn't try to log in, you can ignore this email.</p></div></div>`,
      })
    : await sendOtpSms(phone!, code);
  if (!sent.ok) {
    console.error("[otp] send failed:", sent.error);
    if (email && process.env.NODE_ENV !== "production") console.log(`[mail:dev] OTP for ${email}: ${code}`);
    else return Response.json({ error: email ? "Could not send the email. Please try again or use your mobile." : "Could not send SMS. Please try email OTP or your password." }, { status: 503 });
  }
  await createToken("otp", target, null, 10, code);
  return Response.json({ ok: true, via: email ? "email" : "sms" });
}
