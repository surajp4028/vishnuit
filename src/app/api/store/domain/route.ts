import { revalidatePath } from "next/cache";
import { exec, queryOne } from "@/lib/server/db";
import { effectivePlan } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { cleanDomain, dnsRecords, domainStatus, vercelAdd, vercelReady, vercelRemove } from "@/lib/server/domains";

/** Current domain, the DNS records to add, and whether it is live yet. */
export async function GET() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  if (!store.domain) return Response.json({ domain: null });
  const status = await domainStatus(store.domain);
  const ok = status.state === "live";
  if (ok !== store.domain_ok) {
    await exec("UPDATE stores SET domain_ok=? WHERE id=?", [ok ? 1 : 0, store.id]);
    revalidatePath(`/catalog/@${store.handle}`, "layout");
  }
  return Response.json({ domain: store.domain, records: dnsRecords(store.domain), status });
}

/** Connect a domain. Paid plans only. */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  if (effectivePlan(store) === "free") return Response.json({ error: "Custom domains are on paid plans. Upgrade in Plan & billing.", code: "plan" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { domain?: string };
  const d = cleanDomain(b.domain);
  if (!d) return Response.json({ error: "Enter a domain like pandeyfashion.com or shop.pandeyfashion.com." }, { status: 422 });
  const taken = await queryOne("SELECT id FROM stores WHERE (domain=? OR domain=? OR domain=?) AND id<>?", [d, `www.${d}`, d.replace(/^www\./, ""), store.id]);
  if (taken) return Response.json({ error: "This domain is already connected to another store." }, { status: 409 });
  if (store.domain && store.domain !== d && vercelReady()) await vercelRemove(store.domain);
  if (vercelReady()) {
    const r = await vercelAdd(d);
    if (!r.ok) return Response.json({ error: r.error }, { status: 422 });
  }
  await exec("UPDATE stores SET domain=?, domain_ok=0 WHERE id=?", [d, store.id]);
  return Response.json({ ok: true, domain: d, records: dnsRecords(d), status: await domainStatus(d) });
}

/** Disconnect: the store keeps working on vishnuit.co.in/catalog/@handle. */
export async function DELETE() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  if (store.domain && vercelReady()) await vercelRemove(store.domain);
  await exec("UPDATE stores SET domain=NULL, domain_ok=0 WHERE id=?", [store.id]);
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  return Response.json({ ok: true });
}
