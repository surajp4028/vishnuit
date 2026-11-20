import { exec, queryOne } from "@/lib/server/db";
import { checkPassword, getUser, hashPassword, startSession, type User } from "@/lib/server/users";

/** Change (or set, for OTP / Pay Now accounts) the password. */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const next = String(b.password ?? "");
  if (u.password_hash && !checkPassword(String(b.current ?? ""), u.password_hash)) return Response.json({ error: "Current password is wrong." }, { status: 401 });
  if (next.length < 8) return Response.json({ error: "New password must be at least 8 characters." }, { status: 422 });
  await exec("UPDATE users SET password_hash=?, session_ver=session_ver+1 WHERE id=?", [hashPassword(next), u.id]);
  const fresh = await queryOne<User>("SELECT * FROM users WHERE id=?", [u.id]);
  if (fresh) await startSession(fresh); // keep this device signed in, sign out the others
  return Response.json({ ok: true });
}
