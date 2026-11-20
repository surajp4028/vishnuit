import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { slugify } from "@/lib/server/catalog";
import { requireStoreApi, str } from "@/lib/server/store-auth";

export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 80);
  if (name.length < 2) return Response.json({ error: "Enter a category name." }, { status: 422 });
  const count = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_categories WHERE store_id=?", [a.store.id]);
  if (Number(count?.n) >= 50) return Response.json({ error: "You can have up to 50 categories." }, { status: 422 });
  let slug = slugify(name);
  if (await queryOne("SELECT id FROM store_categories WHERE store_id=? AND slug=?", [a.store.id, slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  await exec("INSERT INTO store_categories (store_id, name, slug, sort) VALUES (?,?,?,?)", [a.store.id, name, slug, Number(count?.n ?? 0)]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true, categories: await query("SELECT * FROM store_categories WHERE store_id=? ORDER BY sort, name", [a.store.id]) });
}
