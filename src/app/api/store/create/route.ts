import { exec, queryOne } from "@/lib/server/db";
import { getUser } from "@/lib/server/users";
import { handleProblem } from "@/lib/server/catalog";
import { str } from "@/lib/server/store-auth";

/** Enroll: create the signed-in user's store on the Free plan. Store code = the user's VISHNU ID. */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  if (await queryOne("SELECT id FROM stores WHERE user_id=?", [u.id])) return Response.json({ error: "You already have a store." }, { status: 409 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 120);
  const handle = str(b.handle, 40).toLowerCase().replace(/^@/, "");
  if (name.length < 2) return Response.json({ error: "Enter your store name." }, { status: 422 });
  const problem = handleProblem(handle);
  if (problem) return Response.json({ error: problem }, { status: 422 });
  if (await queryOne("SELECT id FROM stores WHERE handle=?", [handle])) return Response.json({ error: "This store link is taken. Try another." }, { status: 409 });
  const contact = { phone: u.phone ?? "", whatsapp: (u.phone ?? "").replace(/^\+/, ""), email: u.email ?? "" };
  await exec("INSERT INTO stores (user_id, code, handle, name, contact) VALUES (?,?,?,?,?)", [u.id, u.uid, handle, name, JSON.stringify(contact)]);
  return Response.json({ ok: true, handle });
}
