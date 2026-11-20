import { requireAdminApi } from "@/lib/server/auth";
import { getAccount, resetGoogle, updateAccount, userVolume } from "../_lib";

/** Admin: one account with its Google-link state and volume (stores owned, store orders, payments). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const user = Number.isInteger(id) ? await getAccount(id) : null;
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({ user, volume: await userVolume(id) });
}

/** Admin edits name / email / phone, or `{ resetGoogle: true }` to unlink the Google login. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !(await getAccount(id))) return Response.json({ error: "User not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { name?: unknown; email?: unknown; phone?: unknown; resetGoogle?: unknown };
  if (b.resetGoogle === true) {
    await resetGoogle(id);
    return Response.json({ ok: true, user: await getAccount(id) });
  }
  const err = await updateAccount(id, b);
  if (err) return Response.json({ error: err.error }, { status: err.status });
  return Response.json({ ok: true, user: await getAccount(id) });
}
