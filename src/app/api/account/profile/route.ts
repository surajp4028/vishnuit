import { mainSiteOnly } from "@/lib/server/hosts";
import { exec, queryOne } from "@/lib/server/db";
import { getUser, publicUser, type User } from "@/lib/server/users";

/** Update name and company. Email and phone changes need an OTP (see /api/account/email and /api/account/phone). */
export async function PATCH(req: Request) {
  const notHere = await mainSiteOnly(); // account changes only on vishnuit.co.in, never from a store's own domain
  if (notHere) return notHere;
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const name = String(b.name ?? u.name).trim().slice(0, 120);
  const company = String(b.company ?? u.company ?? "").trim().slice(0, 190) || null;
  if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  await exec("UPDATE users SET name=?, company=? WHERE id=?", [name, company, u.id]);
  const fresh = await queryOne<User>("SELECT * FROM users WHERE id=?", [u.id]);
  return Response.json({ ok: true, user: publicUser(fresh!) });
}
