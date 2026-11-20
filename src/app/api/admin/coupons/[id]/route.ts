import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { active?: boolean };
  if (typeof b.active === "boolean") await exec("UPDATE coupons SET active=? WHERE id=?", [b.active ? 1 : 0, Number((await params).id)]);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  await exec("DELETE FROM coupons WHERE id=?", [Number((await params).id)]);
  return Response.json({ ok: true });
}
