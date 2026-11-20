import Link from "next/link";
import { Search } from "lucide-react";
import { query } from "@/lib/server/db";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type Row = {
  id: number; uid: string; name: string; email: string | null; phone: string | null; source: string; has_password: number; status: string;
  created_at: string; last_login: string | null; store_handle: string | null; store_name: string | null; payments: number; paid: number; orders: number;
};
const SOURCES: Record<string, string> = { signup: "Signed up", paynow: "Pay Now", plan: "Plan purchase", store: "Store customer", otp: "OTP login" };
const d = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

/** Everyone with an account: sign-ups, Pay Now payers, store owners and their shoppers. */
export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "all" } = await searchParams;
  const where: string[] = [];
  const p: unknown[] = [];
  if (q.trim()) { where.push("(u.uid LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)"); const like = `%${q.trim()}%`; p.push(like, like, like, like); }
  if (f === "merchants") where.push("s.id IS NOT NULL");
  if (f === "customers") where.push("u.source='store'");
  if (f === "payers") where.push("EXISTS (SELECT 1 FROM payments x WHERE x.user_id=u.id AND x.status='paid')");
  const [rows, totals] = await Promise.all([
    query<Row>(
      `SELECT u.id, u.uid, u.name, u.email, u.phone, u.source, (u.password_hash IS NOT NULL) has_password, u.status, u.created_at, u.last_login,
         s.handle store_handle, s.name store_name,
         (SELECT COUNT(*) FROM payments x WHERE x.user_id=u.id) payments,
         (SELECT COALESCE(SUM(amount),0) FROM payments x WHERE x.user_id=u.id AND x.status='paid') paid,
         (SELECT COUNT(*) FROM store_orders o WHERE o.customer_id=u.id) orders
       FROM users u LEFT JOIN stores s ON s.user_id=u.id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY u.id DESC LIMIT 500`, p),
    query<Record<string, number>>(
      `SELECT (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY) new7,
              (SELECT COUNT(*) FROM stores) merchants, (SELECT COUNT(*) FROM users WHERE source='store') customers`),
  ]);
  const t = Object.fromEntries(Object.entries(totals[0] ?? {}).map(([k, v]) => [k, Number(v)]));
  const tab = (key: string, label: string) => (
    <Link href={`/admin/users?f=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${f === key ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted"}`}>{label}</Link>
  );
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted">Every account — people who signed up, paid via Pay Now, opened a store, or ordered from a store.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["All users", t.users], ["New (7 days)", t.new7], ["Store owners", t.merchants], ["Store customers", t.customers]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-medium text-muted">{l}</p><p className="mt-1 font-display text-3xl font-bold">{v ?? 0}</p></div>
        ))}
      </div>
      <form className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input type="hidden" name="f" value={f} />
        <div className="relative flex-1"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} placeholder="Search name, email, phone or VISHNU ID" className="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-10 text-sm outline-none focus:border-accent" /></div>
        <div className="flex gap-2 overflow-x-auto">{tab("all", "All")}{tab("merchants", "Store owners")}{tab("customers", "Store customers")}{tab("payers", "Paid us")}</div>
      </form>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[920px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">{["User", "Contact", "Came from", "Store", "Paid us", "Store orders", "Joined", "Last login"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><p className="font-semibold">{r.name || "—"}</p><p className="font-mono text-[11px] text-muted">{r.uid}{!Number(r.has_password) && " · no password"}</p></td>
                <td className="px-4 py-3 text-xs"><p>{r.email ?? "—"}</p><p className="text-muted">{r.phone ?? ""}</p></td>
                <td className="px-4 py-3 text-xs">{SOURCES[r.source] ?? r.source}</td>
                <td className="px-4 py-3 text-xs">{r.store_handle ? <a href={`/catalog/@${r.store_handle}`} target="_blank" rel="noopener" className="font-semibold text-accent">{r.store_name}</a> : "—"}</td>
                <td className="px-4 py-3 text-xs">{Number(r.paid) ? `₹${Number(r.paid).toLocaleString("en-IN")}` : "—"}<span className="text-muted">{Number(r.payments) ? ` · ${r.payments} pay` : ""}</span></td>
                <td className="px-4 py-3 text-xs">{Number(r.orders) || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{d(r.created_at)}</td>
                <td className="px-4 py-3 text-xs text-muted">{d(r.last_login)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
