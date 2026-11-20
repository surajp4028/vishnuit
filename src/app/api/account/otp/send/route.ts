import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/server/auth";
import { sendOtpSms } from "@/lib/server/sms";
import { createToken, normPhone } from "@/lib/server/users";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const phone = normPhone(b.phone);
  if (!phone) return Response.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 422 });
  if (!rateLimit(`otp:${ip}`, 6) || !rateLimit(`otp:${phone}`, 4)) return Response.json({ error: "Too many OTP requests. Please wait a few minutes." }, { status: 429 });
  const code = String(randomInt(100000, 999999));
  const sent = await sendOtpSms(phone, code);
  if (!sent.ok) {
    console.error("[otp] send failed:", sent.error);
    return Response.json({ error: "OTP login is not available right now. Please login with password." }, { status: 503 });
  }
  await createToken("otp", phone, null, 10, code);
  return Response.json({ ok: true });
}
