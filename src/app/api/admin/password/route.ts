import { scryptSync, randomBytes } from "node:crypto";
import { exec, queryOne } from "@/lib/server/db";
import { requireAdminApi, verifyPassword } from "@/lib/server/auth";

export async function POST(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { current, next } = await req.json().catch(() => ({}));
  if (typeof next !== "string" || next.length < 8) return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  const row = await queryOne<{ password_hash: string }>("SELECT password_hash FROM admins WHERE id=?", [a.id]);
  if (!row || !verifyPassword(String(current ?? ""), row.password_hash)) return Response.json({ error: "Current password is incorrect." }, { status: 401 });
  const salt = randomBytes(16).toString("hex");
  await exec("UPDATE admins SET password_hash=? WHERE id=?", [`scrypt$${salt}$${scryptSync(next, salt, 64).toString("hex")}`, a.id]);
  return Response.json({ ok: true });
}
