import { revalidatePath } from "next/cache";
import { exec, query } from "@/lib/server/db";
import { requireStoreApi, str } from "@/lib/server/store-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const name = str(((await req.json().catch(() => ({}))) as Record<string, unknown>).name, 80);
  if (name.length < 2) return Response.json({ error: "Enter a category name." }, { status: 422 });
  await exec("UPDATE store_categories SET name=? WHERE id=? AND store_id=?", [name, id, a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await query("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [a.store.id]) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  await exec("UPDATE store_products SET category_id=NULL WHERE category_id=? AND store_id=?", [id, a.store.id]);
  await exec("DELETE FROM store_categories WHERE id=? AND store_id=?", [id, a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await query("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [a.store.id]) });
}
