import { exec, queryOne } from "@/lib/server/db";
import { getUser } from "@/lib/server/users";
import { getCatalogConfig, handleProblem } from "@/lib/server/catalog";
import { str } from "@/lib/server/store-auth";

/** Enroll: create the signed-in user's store on the Free plan. Store code = the user's VISHNU ID. */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  if (!(await getCatalogConfig()).features.newStores) return Response.json({ error: "New stores are not open right now." }, { status: 403 });
  if (await queryOne("SELECT id FROM stores WHERE user_id=?", [u.id])) return Response.json({ error: "You already have a store." }, { status: 409 });
  if (!u.phone) return Response.json({ error: "Please verify your mobile number first." }, { status: 422 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 120);
  const handle = str(b.handle, 40).toLowerCase().replace(/^@/, "");
  if (name.length < 2) return Response.json({ error: "Enter your store name." }, { status: 422 });
  const problem = handleProblem(handle);
  if (problem) return Response.json({ error: problem }, { status: 422 });
  if (await queryOne("SELECT id FROM stores WHERE handle=?", [handle])) return Response.json({ error: "This store link is taken. Try another." }, { status: 409 });
  // Re-read the user: the phone may have just been verified on this page.
  const fresh = await queryOne<{ phone: string | null; email: string | null }>("SELECT phone, email FROM users WHERE id=?", [u.id]);
  const contact = { phone: fresh?.phone ?? "", whatsapp: (fresh?.phone ?? "").replace(/^\+/, ""), email: fresh?.email ?? "" };
  await exec("INSERT INTO stores (user_id, code, handle, name, contact) VALUES (?,?,?,?,?)", [u.id, u.uid, handle, name, JSON.stringify(contact)]);
  return Response.json({ ok: true, handle });
}
