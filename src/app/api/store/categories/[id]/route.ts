import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { requireStoreApi, str } from "@/lib/server/store-auth";

const list = (storeId: number) => query("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [storeId]);

/** Rename and/or move a category (parent_id: number = make it a sub-category, null = top-level). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cur = await queryOne<{ id: number }>("SELECT id FROM store_categories WHERE id=? AND store_id=?", [id, a.store.id]);
  if (!cur) return Response.json({ error: "Category not found." }, { status: 404 });
  if (b.name !== undefined) {
    const name = str(b.name, 80);
    if (name.length < 2) return Response.json({ error: "Enter a category name." }, { status: 422 });
    await exec("UPDATE store_categories SET name=? WHERE id=?", [name, id]);
  }
  if (b.parent_id !== undefined) {
    const pid = b.parent_id ? Number(b.parent_id) : null;
    if (pid) {
      if (pid === id) return Response.json({ error: "A category can't be inside itself." }, { status: 422 });
      const p = await queryOne<{ parent_id: number | null }>("SELECT parent_id FROM store_categories WHERE id=? AND store_id=?", [pid, a.store.id]);
      if (!p) return Response.json({ error: "Parent category not found." }, { status: 404 });
      if (p.parent_id) return Response.json({ error: "Pick a main category as the parent." }, { status: 422 });
      const kids = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_categories WHERE parent_id=? AND store_id=?", [id, a.store.id]);
      if (Number(kids?.n)) return Response.json({ error: "This category has sub-categories — move them out first." }, { status: 422 });
    }
    await exec("UPDATE store_categories SET parent_id=? WHERE id=?", [pid, id]);
  }
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await list(a.store.id) });
}

/** Delete: its products keep existing without a category; its sub-categories become main categories. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  await exec("UPDATE store_products SET category_id=NULL WHERE category_id=? AND store_id=?", [id, a.store.id]);
  await exec("UPDATE store_categories SET parent_id=NULL WHERE parent_id=? AND store_id=?", [id, a.store.id]);
  await exec("DELETE FROM store_categories WHERE id=? AND store_id=?", [id, a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await list(a.store.id) });
}
