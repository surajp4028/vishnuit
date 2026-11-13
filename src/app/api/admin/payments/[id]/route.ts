import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

const PROJECT = ["onboarding", "in-progress", "review", "delivered", "on-hold"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { project_status, notes } = await req.json().catch(() => ({}));
  const id = Number((await params).id);
  if (project_status !== undefined) {
    if (!PROJECT.includes(project_status)) return Response.json({ error: "Bad status" }, { status: 400 });
    await exec("UPDATE payments SET project_status=? WHERE id=?", [project_status, id]);
  }
  if (typeof notes === "string") await exec("UPDATE payments SET notes=? WHERE id=?", [notes.slice(0, 5000), id]);
  return Response.json({ ok: true });
}
