import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

const STATUSES = ["new", "contacted", "qualified", "won", "lost"];
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { status, notes } = await req.json().catch(() => ({}));
  const id = Number((await params).id);
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return Response.json({ error: "Bad status" }, { status: 400 });
    await exec("UPDATE leads SET status=? WHERE id=?", [status, id]);
  }
  if (typeof notes === "string") await exec("UPDATE leads SET notes=? WHERE id=?", [notes.slice(0, 5000), id]);
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  await exec("DELETE FROM leads WHERE id=?", [Number((await params).id)]);
  return Response.json({ ok: true });
}
