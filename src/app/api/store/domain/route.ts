import { effectivePlan } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { connectDomain, disconnectDomain, domainInfo } from "@/lib/server/domains";

/** Seller → Domain: current domain, DNS records to add, and whether it is live yet. */
export async function GET() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  return Response.json(await domainInfo(a.store));
}

/** Connect a domain. Paid plans only (the admin can connect one for any plan). */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  if (effectivePlan(a.store) === "free") return Response.json({ error: "Custom domains are on paid plans. Upgrade in Plan & billing.", code: "plan" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { domain?: string };
  const r = await connectDomain(a.store, b.domain);
  return r.ok ? Response.json({ ok: true, ...r.info }) : Response.json({ error: r.error }, { status: r.status });
}

export async function DELETE() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  await disconnectDomain(a.store);
  return Response.json({ ok: true });
}
