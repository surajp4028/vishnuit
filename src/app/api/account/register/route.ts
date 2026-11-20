import { headers } from "next/headers";
import { exec, queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { findOrCreateUser, hashPassword, normEmail, normPhone, publicUser, startSession, type User } from "@/lib/server/users";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`reg:${ip}`, 8)) return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const name = String(b.name ?? "").trim().slice(0, 120);
  const email = normEmail(b.email);
  const phone = normPhone(b.phone);
  const password = String(b.password ?? "");
  if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  if (!email) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
  if (!phone) return Response.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 422 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 422 });

  // An account may already exist silently (created by Pay Now). It must be claimed via "Forgot password" so only the real owner gets in.
  const existing = await queryOne<User>("SELECT * FROM users WHERE email=? OR phone=? LIMIT 1", [email, phone]);
  if (existing) {
    return Response.json(
      { error: existing.password_hash ? "An account with this email or phone already exists. Please log in." : "We already have your details from a payment. Use “Forgot password” to set your password.", code: "exists" },
      { status: 409 },
    );
  }
  const u = await findOrCreateUser({ name, email, phone, source: "signup" });
  await exec("UPDATE users SET password_hash=? WHERE id=?", [hashPassword(password), u.id]);
  await startSession(u);
  return Response.json({ ok: true, user: publicUser(u) });
}
