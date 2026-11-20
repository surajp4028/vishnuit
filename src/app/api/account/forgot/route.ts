import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { sendMail } from "@/lib/server/mail";
import { siteUrl } from "@/lib/site";
import { createToken, normEmail, type User } from "@/lib/server/users";

/** Emails a 30-minute password-reset link. Always answers "ok" so emails can't be probed. */
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`forgot:${ip}`, 5)) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = normEmail(b.email);
  if (!email) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
  const u = await queryOne<User>("SELECT * FROM users WHERE email=? AND status='active'", [email]);
  if (u) {
    const code = randomBytes(24).toString("base64url");
    await createToken("reset", email, u.id, 30, code);
    const link = `${siteUrl()}/reset-password?e=${encodeURIComponent(email)}&t=${code}`;
    const r = await sendMail({
      to: email,
      subject: "Set your Vishnu IT Solutions password",
      text: `Hi ${u.name || "there"},\n\nUse this link to set a new password (valid for 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#0a0f1f,#1d4ed8);color:#fff;padding:22px 26px;font-size:20px;font-weight:700">Set your password</div><div style="padding:22px 26px;font-size:14px;color:#333"><p>Hi ${esc(u.name || "there")},</p><p>Tap the button to set a new password for your Vishnu IT Solutions account. The link works for 30 minutes.</p><p style="margin:22px 0"><a href="${link}" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Set password</a></p><p style="color:#667;font-size:12px">If you didn't ask for this, you can ignore this email.</p></div></div>`,
    });
    if (!r.ok) console.error("[forgot] email failed:", r.error);
  }
  return Response.json({ ok: true });
}
