import { ExternalLink } from "lucide-react";
import { query } from "@/lib/server/db";
import Link from "next/link";
import { effectivePlan, getCatalogConfig, type PlanKey } from "@/lib/server/catalog";
import { StoreRowEdit } from "@/components/admin/store-row-edit";
import { GoogleBadge, StoreManage } from "@/components/admin/account-editor";
import { adminDate } from "@/components/admin/fmt";

export const metadata = { title: "Catalog Stores" };
export const dynamic = "force-dynamic";

type Row = {
  id: number; code: string; handle: string; name: string; plan: PlanKey; plan_expires_at: string | null; status: string; created_at: string;
  owner: string; owner_id: number; owner_uid: string; google: number; email: string | null; phone: string | null; products: number; orders: number; images: number;
};

export default async function StoresAdmin() {
  const [rows, totals, cfg] = await Promise.all([
    query<Row>(
      `SELECT s.id, s.code, s.handle, s.name, s.plan, s.plan_expires_at, s.status, s.created_at, u.name owner, u.id owner_id, u.uid owner_uid, (u.google_sub IS NOT NULL) google, u.email, u.phone,
         (SELECT COUNT(*) FROM store_products p WHERE p.store_id=s.id) products,
         (SELECT COUNT(*) FROM store_orders o WHERE o.store_id=s.id) orders,
         (SELECT COALESCE(SUM(JSON_LENGTH(p.images)),0) FROM store_products p WHERE p.store_id=s.id) images
       FROM stores s JOIN users u ON u.id=s.user_id ORDER BY s.id DESC LIMIT 1000`,
    ),
    query<Record<string, number>>(
      `SELECT (SELECT COUNT(*) FROM stores) stores, (SELECT COUNT(*) FROM stores WHERE created_at >= NOW() - INTERVAL 7 DAY) new7,
              (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM store_products) products, (SELECT COUNT(*) FROM store_orders) orders,
              (SELECT COALESCE(SUM(amount),0) FROM payments WHERE kind='subscription' AND status='paid') planRevenue`,
    ),
    getCatalogConfig(),
  ]);
  const PLANS = cfg.plans;
  const t = Object.fromEntries(Object.entries(totals[0] ?? {}).map(([k, v]) => [k, Number(v)]));
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Catalog Stores</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mt-1 text-sm text-muted">Merchants who opened a store at vishnuit.co.in/catalog/@name.</p>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/catalog-settings" className="rounded-full border border-border px-4 py-2 font-semibold">Settings & plans</Link>
          <Link href="/admin/coupons" className="rounded-full border border-border px-4 py-2 font-semibold">Coupons</Link>
        </div>
      </div>
      {!cfg.features.enabled && <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700">The catalog feature is switched OFF in Catalog Settings — stores are hidden and nobody can enroll.</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[["Stores", t.stores], ["New (7 days)", t.new7], ["All users", t.users], ["Products", t.products], ["Plan revenue ₹", Math.round(t.planRevenue ?? 0).toLocaleString("en-IN")]].map(([l, v]) => (
          <Link key={l} href={l === "All users" ? "/admin/users" : "#"} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-medium text-muted">{l}{l === "All users" ? " →" : ""}</p><p className="mt-1 font-display text-3xl font-bold">{v ?? 0}</p></Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            {["Store", "Owner", "Plan", "Products", "Images (storage)", "Orders", "Joined", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const eff = effectivePlan(r);
              const limit = PLANS[eff].limit ?? Infinity;
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold">{r.name}</p><p className="text-xs text-muted">@{r.handle} · {r.code}</p></td>
                  <td className="px-4 py-3"><p>{r.owner || "—"} <span className="font-mono text-[10px] text-muted">#{r.owner_id}</span></p><p className="text-xs text-muted">{r.email ?? r.phone ?? ""}</p>{Number(r.google) ? <div className="mt-1"><GoogleBadge email={r.email} /></div> : null}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{PLANS[eff].name}</span>{r.plan_expires_at && <p className="mt-1 text-[11px] text-muted">till {adminDate(r.plan_expires_at)}</p>}</td>
                  <td className="px-4 py-3">{Number(r.products)}{Number.isFinite(limit) ? <span className="text-muted">/{limit}</span> : ""}</td>
                  <td className="px-4 py-3">{Number(r.images)} photos <span className="text-xs text-muted">(~{(Number(r.images) * 0.15).toFixed(1)} MB)</span></td>
                  <td className="px-4 py-3">{Number(r.orders)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{adminDate(r.created_at)}</td>
                  <td className="px-4 py-3"><div className="flex flex-col items-start gap-2"><a href={`/catalog/@${r.handle}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-semibold text-accent">Open <ExternalLink className="size-3" /></a><StoreManage id={r.id} /><StoreRowEdit id={r.id} plan={r.plan} expires={r.plan_expires_at ? new Date(r.plan_expires_at).toISOString() : null} status={r.status} />{r.status !== "active" && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">SUSPENDED</span>}</div></td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No stores yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
