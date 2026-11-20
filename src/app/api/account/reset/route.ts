import { exec, queryOne } from "@/lib/server/db";
import { consumeToken, hashPassword, normEmail, startSession, type User } from "@/lib/server/users";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = normEmail(b.email);
  const password = String(b.password ?? "");
  if (!email || !b.token) return Response.json({ error: "This link is invalid. Please request a new one." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 422 });
  const t = await consumeToken("reset", email, String(b.token));
  if (!t?.user_id) return Response.json({ error: "This link has expired or was already used. Please request a new one." }, { status: 400 });
  // New password also signs out every other device.
  await exec("UPDATE users SET password_hash=?, session_ver=session_ver+1 WHERE id=?", [hashPassword(password), t.user_id]);
  const u = await queryOne<User>("SELECT * FROM users WHERE id=?", [t.user_id]);
  if (u) await startSession(u);
  return Response.json({ ok: true });
}
