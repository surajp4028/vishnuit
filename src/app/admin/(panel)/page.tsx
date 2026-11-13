import Link from "next/link";
import { ArrowUpRight, Briefcase, FileText, Inbox, MessageSquareQuote, Sparkles, Target, TrendingUp, Trophy, Wallet } from "lucide-react";
import { query } from "@/lib/server/db";
import { formatDate } from "@/lib/utils";

type Lead = { id: number; name: string; email: string; service: string; status: string; created_at: string; source: string };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contacted: "bg-amber-500/10 text-amber-600",
  qualified: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-red-500/10 text-red-500",
};

export default async function Dashboard() {
  const [counts, statusRows, daily, byService, recent] = await Promise.all([
    query<Record<string, number>>(
      `SELECT (SELECT COUNT(*) FROM services) services, (SELECT COUNT(*) FROM projects) projects, (SELECT COUNT(*) FROM testimonials) testimonials,
              (SELECT COUNT(*) FROM posts) posts, (SELECT COUNT(*) FROM leads) leads,
              (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL 30 DAY) leads30,
              (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid') revenue,
              (SELECT COUNT(*) FROM payments WHERE status='paid') sales`,
    ),
    query<{ status: string; c: number }>("SELECT status, COUNT(*) c FROM leads GROUP BY status"),
    query<{ d: string; c: number }>("SELECT DATE(created_at) d, COUNT(*) c FROM leads WHERE created_at >= CURDATE() - INTERVAL 13 DAY GROUP BY DATE(created_at)"),
    query<{ service: string; c: number }>("SELECT COALESCE(NULLIF(service,''),'Not specified') service, COUNT(*) c FROM leads GROUP BY 1 ORDER BY c DESC LIMIT 6"),
    query<Lead>("SELECT id,name,email,service,status,created_at,source FROM leads ORDER BY id DESC LIMIT 6"),
  ]);
  const c = Object.fromEntries(Object.entries(counts[0] ?? {}).map(([k, v]) => [k, Number(v)]));
  const st = Object.fromEntries(statusRows.map((r) => [r.status, Number(r.c)]));
  const total = Number(c.leads || 0);
  const won = st.won || 0;
  const conv = total ? ((won / total) * 100).toFixed(1) : "0.0";

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), c: Number(daily.find((x) => String(x.d).slice(0, 10) === key)?.c ?? 0) };
  });
  const max = Math.max(1, ...days.map((d) => d.c));
  const svcMax = Math.max(1, ...byService.map((s) => Number(s.c)));

  const kpis = [
    { label: "Total leads", value: total, icon: Inbox, sub: `${c.leads30 || 0} in last 30 days` },
    { label: "New / unread", value: st.new || 0, icon: Target, sub: "Need a reply" },
    { label: "Won clients", value: won, icon: Trophy, sub: `${st.qualified || 0} qualified in pipeline` },
    { label: "Conversion rate", value: `${conv}%`, icon: TrendingUp, sub: "Won ÷ total leads" },
    { label: "Online revenue", value: `₹${Number(c.revenue || 0).toLocaleString("en-IN")}`, icon: Wallet, sub: `${c.sales || 0} plans sold via Razorpay` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted">Leads, conversions and content at a glance.</p>
        </div>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">Manage leads <ArrowUpRight className="size-4" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{k.label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent"><k.icon className="size-4" /></span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold">{k.value}</p>
            <p className="mt-1 text-xs text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <p className="font-semibold">Leads — last 14 days</p>
          <div className="mt-6 flex h-48 items-end gap-1.5 md:gap-2">
            {days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 group-hover:opacity-100">{d.c}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-accent to-blue-400 transition-all" style={{ height: `${Math.max(3, (d.c / max) * 100)}%`, opacity: d.c ? 1 : 0.2 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 md:gap-2">
            {days.map((d, i) => <span key={d.key} className="flex-1 text-center text-[10px] text-muted">{i % 2 === 0 ? d.label : ""}</span>)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">Conversion funnel</p>
          <div className="mt-5 space-y-3">
            {["new", "contacted", "qualified", "won", "lost"].map((s) => (
              <div key={s}>
                <div className="mb-1 flex justify-between text-xs"><span className="capitalize">{s}</span><span className="text-muted">{st[s] || 0}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/5"><div className={`h-full rounded-full ${s === "won" ? "bg-emerald-500" : s === "lost" ? "bg-red-400" : "bg-accent"}`} style={{ width: `${total ? ((st[s] || 0) / total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card xl:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3"><p className="font-semibold">Recent leads</p><Link href="/admin/leads" className="text-sm font-medium text-accent">View all</Link></div>
          {recent.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted">No leads yet. Enquiries from the contact form will appear here and in your inbox.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <tbody>
                  {recent.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-5 py-3"><p className="font-medium">{l.name}</p><p className="text-xs text-muted">{l.email}</p></td>
                      <td className="px-5 py-3 text-muted">{l.service || "—"}</td>
                      <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[l.status]}`}>{l.status}</span></td>
                      <td className="px-5 py-3 text-right text-xs text-muted">{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">Top requested services</p>
          <div className="mt-5 space-y-3">
            {byService.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
            {byService.map((s) => (
              <div key={s.service}>
                <div className="mb-1 flex justify-between text-xs"><span className="truncate pr-2">{s.service}</span><span className="text-muted">{s.c}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/5"><div className="h-full rounded-full bg-[#d4a017]" style={{ width: `${(Number(s.c) / svcMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Services", n: c.services, href: "/admin/c/services", icon: Sparkles },
          { label: "Portfolio projects", n: c.projects, href: "/admin/c/projects", icon: Briefcase },
          { label: "Testimonials", n: c.testimonials, href: "/admin/c/testimonials", icon: MessageSquareQuote },
          { label: "Blog posts", n: c.posts, href: "/admin/c/posts", icon: FileText },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-accent/50">
            <span className="grid size-11 place-items-center rounded-xl bg-foreground text-background"><x.icon className="size-5" /></span>
            <div className="flex-1"><p className="font-display text-2xl font-bold">{x.n}</p><p className="text-xs text-muted">{x.label}</p></div>
            <ArrowUpRight className="size-4 text-muted group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
