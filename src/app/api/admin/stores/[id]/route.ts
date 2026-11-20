import { revalidatePath } from "next/cache";
import { exec, queryOne } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { PLAN_KEYS, handleProblem } from "@/lib/server/catalog";
import { getAccount, planPayments, storeVolume } from "../../users/_lib";

type StoreRow = { id: number; user_id: number; code: string; handle: string; name: string; plan: string; plan_expires_at: string | null; status: string; domain: string | null; created_at: string };

/** Admin: store details, its owner account (Google-link state) and transaction volume. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const s = await queryOne<StoreRow>("SELECT id, user_id, code, handle, name, plan, plan_expires_at, status, domain, created_at FROM stores WHERE id=?", [id]);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  const [owner, volume, plan] = await Promise.all([getAccount(s.user_id), storeVolume(id), planPayments(s.user_id)]);
  return Response.json({ store: s, owner, volume: { ...volume, planPayments: plan } });
}

/** Admin edits a store: name / handle, plan / expiry by hand (upgrades, adjustments, free months), or suspends it. The store code is fixed. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const s = await queryOne<{ handle: string }>("SELECT handle FROM stores WHERE id=?", [id]);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { plan?: string; expires?: string | null; status?: string; name?: unknown; handle?: unknown };

  // Validate everything first so a bad field doesn't leave a half-saved store.
  let name: string | undefined;
  let handle: string | undefined;
  if (b.name !== undefined) {
    name = String(b.name ?? "").trim().slice(0, 120);
    if (!name) return Response.json({ error: "Store name can't be empty." }, { status: 422 });
  }
  if (b.handle !== undefined) {
    handle = String(b.handle ?? "").trim().toLowerCase().replace(/^@/, "");
    if (handle !== s.handle) {
      const problem = handleProblem(handle);
      if (problem) return Response.json({ error: problem }, { status: 422 });
      const taken = await queryOne<{ id: number; name: string; code: string }>("SELECT id, name, code FROM stores WHERE handle=? AND id<>?", [handle, id]);
      if (taken) return Response.json({ error: `@${handle} is already used by store #${taken.id} · ${taken.code} · ${taken.name}` }, { status: 409 });
    } else handle = undefined;
  }
  let exp: Date | null = null;
  if (b.plan !== undefined) {
    if (!PLAN_KEYS.includes(b.plan as never)) return Response.json({ error: "Bad plan" }, { status: 422 });
    exp = b.plan === "free" ? null : b.expires ? new Date(`${b.expires}T23:59:59+05:30`) : null;
    if (b.plan !== "free" && (!exp || Number.isNaN(exp.getTime()))) return Response.json({ error: "Pick an expiry date for a paid plan." }, { status: 422 });
  }

  if (name !== undefined) await exec("UPDATE stores SET name=? WHERE id=?", [name, id]);
  if (handle !== undefined) {
    try {
      await exec("UPDATE stores SET handle=? WHERE id=?", [handle, id]);
    } catch (e) {
      if ((e as { code?: string }).code === "ER_DUP_ENTRY") return Response.json({ error: `@${handle} was just taken by another store.` }, { status: 409 });
      throw e;
    }
  }
  if (b.plan !== undefined) await exec("UPDATE stores SET plan=?, plan_expires_at=?, reminder_sent_at=NULL WHERE id=?", [b.plan, exp, id]);
  if (b.status === "active" || b.status === "suspended") await exec("UPDATE stores SET status=? WHERE id=?", [b.status, id]);
  revalidatePath(`/catalog/@${s.handle}`, "layout");
  if (handle) revalidatePath(`/catalog/@${handle}`, "layout");
  return Response.json({ ok: true, handle: handle ?? s.handle });
}
