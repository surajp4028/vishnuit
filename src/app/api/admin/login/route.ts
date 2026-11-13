import { headers } from "next/headers";
import { queryOne, exec } from "@/lib/server/db";
import { rateLimit, setSession, verifyPassword } from "@/lib/server/auth";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`login:${ip}`)) return Response.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") return Response.json({ error: "Email and password are required." }, { status: 400 });
  let admin: { id: number; email: string; password_hash: string } | null = null;
  try {
    admin = await queryOne("SELECT id, email, password_hash FROM admins WHERE email=?", [email.trim().toLowerCase()]);
  } catch {
    return Response.json({ error: "Database unavailable. Is MySQL running?" }, { status: 503 });
  }
  if (!admin || !verifyPassword(password, admin.password_hash)) return Response.json({ error: "Invalid email or password." }, { status: 401 });
  await setSession(admin.id, admin.email);
  await exec("UPDATE admins SET last_login_at=NOW() WHERE id=?", [admin.id]).catch(() => {});
  return Response.json({ ok: true });
}
