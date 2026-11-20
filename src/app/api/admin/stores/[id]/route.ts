import { revalidatePath } from "next/cache";
import { exec, queryOne } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { PLAN_KEYS } from "@/lib/server/catalog";

/** Admin sets a store's plan / expiry by hand (upgrades, adjustments, free months) or suspends it. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const s = await queryOne<{ handle: string }>("SELECT handle FROM stores WHERE id=?", [id]);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { plan?: string; expires?: string | null; status?: string };
  if (b.plan !== undefined) {
    if (!PLAN_KEYS.includes(b.plan as never)) return Response.json({ error: "Bad plan" }, { status: 422 });
    const exp = b.plan === "free" ? null : b.expires ? new Date(`${b.expires}T23:59:59+05:30`) : null;
    if (b.plan !== "free" && (!exp || Number.isNaN(exp.getTime()))) return Response.json({ error: "Pick an expiry date for a paid plan." }, { status: 422 });
    await exec("UPDATE stores SET plan=?, plan_expires_at=?, reminder_sent_at=NULL WHERE id=?", [b.plan, exp, id]);
  }
  if (b.status === "active" || b.status === "suspended") await exec("UPDATE stores SET status=? WHERE id=?", [b.status, id]);
  revalidatePath(`/catalog/@${s.handle}`, "layout");
  return Response.json({ ok: true });
}
