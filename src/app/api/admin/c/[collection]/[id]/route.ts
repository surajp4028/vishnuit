import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { getCollection, toRow, refreshSite } from "@/lib/server/admin-crud";

type Ctx = { params: Promise<{ collection: string; id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { collection, id } = await params;
  const c = getCollection(collection);
  if (!c) return Response.json({ error: "Unknown collection" }, { status: 404 });
  try {
    const row = toRow(c, await req.json());
    const cols = Object.keys(row);
    await exec(`UPDATE ${c.table} SET ${cols.map((k) => `\`${k}\`=?`).join(",")} WHERE id=?`, [...Object.values(row), Number(id)]);
    refreshSite();
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg.includes("Duplicate") ? "That slug is already used." : msg }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { collection, id } = await params;
  const c = getCollection(collection);
  if (!c) return Response.json({ error: "Unknown collection" }, { status: 404 });
  await exec(`DELETE FROM ${c.table} WHERE id=?`, [Number(id)]);
  refreshSite();
  return Response.json({ ok: true });
}
