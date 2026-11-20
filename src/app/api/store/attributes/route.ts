import { exec } from "@/lib/server/db";
import { cleanAttributes, getAttributes } from "@/lib/server/attributes";
import { requireStoreApi } from "@/lib/server/store-auth";

/** The store's attribute library (Size, Colour…), reused when adding products. */
export async function GET() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  return Response.json({ attributes: await getAttributes(a.store.id) });
}

export async function PUT(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { attributes?: unknown };
  const list = cleanAttributes(b.attributes);
  await exec("UPDATE stores SET attributes=? WHERE id=?", [JSON.stringify(list), a.store.id]);
  return Response.json({ ok: true, attributes: list });
}
