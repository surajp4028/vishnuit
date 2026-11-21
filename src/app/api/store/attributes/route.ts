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
  // Only a real list may replace the library — a bad or empty body must never wipe it.
  if (!Array.isArray(b.attributes)) return Response.json({ error: "Send the attribute list." }, { status: 422 });
  const list = cleanAttributes(b.attributes);
  if (b.attributes.length > 0 && list.length === 0) return Response.json({ error: "Those attributes aren't valid — nothing was changed." }, { status: 422 });
  await exec("UPDATE stores SET attributes=? WHERE id=?", [JSON.stringify(list), a.store.id]);
  return Response.json({ ok: true, attributes: list });
}
