import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { slugify } from "@/lib/server/catalog";
import { requireStoreApi, str } from "@/lib/server/store-auth";

const list = (storeId: number) => query("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [storeId]);

/** Add a category or a sub-category (parent_id). Only two levels. */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 80);
  if (name.length < 2) return Response.json({ error: "Enter a category name." }, { status: 422 });
  const parentId = b.parent_id ? Number(b.parent_id) : null;
  if (parentId) {
    const p = await queryOne<{ parent_id: number | null }>("SELECT parent_id FROM store_categories WHERE id=? AND store_id=?", [parentId, a.store.id]);
    if (!p) return Response.json({ error: "Parent category not found." }, { status: 404 });
    if (p.parent_id) return Response.json({ error: "Sub-categories can't have their own sub-categories." }, { status: 422 });
  }
  const count = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_categories WHERE store_id=?", [a.store.id]);
  if (Number(count?.n) >= 100) return Response.json({ error: "You can have up to 100 categories." }, { status: 422 });
  let slug = slugify(name);
  if (await queryOne("SELECT id FROM store_categories WHERE store_id=? AND slug=?", [a.store.id, slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  await exec("INSERT INTO store_categories (store_id, parent_id, name, slug, sort) VALUES (?,?,?,?,?)", [a.store.id, parentId, name, slug, Number(count?.n ?? 0)]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await list(a.store.id) });
}

/** Save a new order: { order: [id, id, …] } → sort = position. */
export async function PATCH(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { order?: unknown };
  const ids = (Array.isArray(b.order) ? b.order : []).map(Number).filter(Number.isFinite).slice(0, 200);
  for (const [i, id] of ids.entries()) await exec("UPDATE store_categories SET sort=? WHERE id=? AND store_id=?", [i, id, a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await list(a.store.id) });
}
