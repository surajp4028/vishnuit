import { exec, queryOne } from "@/lib/server/db";
import { getUser, normEmail, publicUser, type User } from "@/lib/server/users";

/** Update name, company and (if not taken) email. Phone changes need OTP, so they're not editable here. */
export async function PATCH(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const name = String(b.name ?? u.name).trim().slice(0, 120);
  const company = String(b.company ?? u.company ?? "").trim().slice(0, 190) || null;
  if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  let email = u.email;
  if (b.email !== undefined && b.email !== u.email) {
    const e = normEmail(b.email);
    if (!e) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
    if (await queryOne("SELECT id FROM users WHERE email=? AND id<>?", [e, u.id])) return Response.json({ error: "This email is used by another account." }, { status: 409 });
    email = e;
  }
  await exec("UPDATE users SET name=?, company=?, email=? WHERE id=?", [name, company, email, u.id]);
  const fresh = await queryOne<User>("SELECT * FROM users WHERE id=?", [u.id]);
  return Response.json({ ok: true, user: publicUser(fresh!) });
}
