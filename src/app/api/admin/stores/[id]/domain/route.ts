import { queryOne } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { connectDomain, disconnectDomain, domainInfo } from "@/lib/server/domains";

/** Admin → Stores → Manage → Domain. Same flow as the seller's own Domain page, on any plan. */
async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return queryOne<{ id: number; handle: string; domain: string | null; domain_ok: number }>("SELECT id, handle, domain, domain_ok FROM stores WHERE id=?", [id]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const s = await load(params);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  return Response.json(await domainInfo(s));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const s = await load(params);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { domain?: string };
  const r = await connectDomain(s, b.domain);
  return r.ok ? Response.json({ ok: true, ...r.info }) : Response.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const s = await load(params);
  if (!s) return Response.json({ error: "Store not found" }, { status: 404 });
  await disconnectDomain(s);
  return Response.json({ ok: true });
}
