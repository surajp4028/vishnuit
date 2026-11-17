"use client";
import { useMemo, useState } from "react";
import { BadgeIndianRupee, Download, Mail, MessageCircle, Phone, Search, Users, Wallet, X, FileText } from "lucide-react";
import { cn, formatDate, formatINR } from "@/lib/utils";

export type PaymentRow = {
  id: number; plan_name: string; amount: number; name: string; email: string; phone: string; company: string; notes: string | null;
  rzp_order_id: string; rzp_payment_id: string | null; method: string | null; status: string; project_status: string; created_at: string; paid_at: string | null; invoiceUrl?: string | null;
};
const PROJECT = ["onboarding", "in-progress", "review", "delivered", "on-hold"];
const PAY_COLORS: Record<string, string> = { paid: "bg-emerald-500/10 text-emerald-600", created: "bg-amber-500/10 text-amber-600", failed: "bg-red-500/10 text-red-500" };

export function PaymentsTable({ initial, testMode }: { initial: PaymentRow[]; testMode: boolean }) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<"clients" | "all">("clients");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<PaymentRow | null>(null);
  const paid = rows.filter((r) => r.status === "paid");
  const revenue = paid.reduce((a, r) => a + r.amount, 0);
  const month = new Date().toISOString().slice(0, 7);
  const monthRevenue = paid.filter((r) => (r.paid_at ?? "").startsWith(month)).reduce((a, r) => a + r.amount, 0);
  const byPlan = Object.entries(paid.reduce<Record<string, number>>((a, r) => ((a[r.plan_name] = (a[r.plan_name] ?? 0) + 1), a), {}));

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return (tab === "clients" ? paid : rows).filter((r) => !s || [r.name, r.email, r.phone, r.company, r.plan_name, r.rzp_payment_id].join(" ").toLowerCase().includes(s));
  }, [rows, paid, tab, q]);

  async function patch(id: number, data: Partial<PaymentRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...data } : r)));
    if (open?.id === id) setOpen((o) => (o ? { ...o, ...data } : o));
    await fetch(`/api/admin/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
            Payments & Clients
            {testMode && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">Razorpay test mode</span>}
          </h1>
          <p className="text-sm text-muted">Every plan purchased through the website via Razorpay.</p>
        </div>
        <a href="/api/admin/payments/export" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent"><Download className="size-4" /> Export CSV</a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total revenue", value: formatINR(revenue), icon: Wallet },
          { label: "This month", value: formatINR(monthRevenue), icon: BadgeIndianRupee },
          { label: "Paying clients", value: String(new Set(paid.map((p) => p.email)).size), icon: Users },
          { label: "Plans sold", value: byPlan.map(([k, v]) => `${k} ${v}`).join(" · ") || "—", icon: BadgeIndianRupee },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-muted">{k.label}</p><span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent"><k.icon className="size-4" /></span></div>
            <p className="mt-3 truncate font-display text-2xl font-extrabold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["clients", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", tab === t ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
            {t === "clients" ? `Paid clients (${paid.length})` : `All transactions (${rows.length})`}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, payment id…" className="w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 text-sm outline-none focus:border-accent" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {list.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No {tab === "clients" ? "paid clients" : "transactions"} yet. Purchases from the pricing section will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-foreground/[0.03] text-left text-xs text-muted">
                <tr><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Payment</th><th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 font-medium">Date</th></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer border-t border-border hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3"><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.email}{r.company ? ` · ${r.company}` : ""}</p></td>
                    <td className="px-4 py-3 font-medium">{r.plan_name}</td>
                    <td className="px-4 py-3 font-semibold">{formatINR(r.amount)}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", PAY_COLORS[r.status])}>{r.status === "created" ? "pending" : r.status}</span><p className="mt-1 font-mono text-[10px] text-muted">{r.rzp_payment_id ?? r.rzp_order_id}</p></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {r.status === "paid" ? (
                        <select value={r.project_status} onChange={(e) => patch(r.id, { project_status: e.target.value })} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs capitalize outline-none">
                          {PROJECT.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                        </select>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate((r.paid_at ?? r.created_at).replace(" ", "T"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><h2 className="font-display text-xl font-bold">{open.name}</h2><p className="text-sm text-muted">{open.plan_name} · {formatINR(open.amount)}</p></div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <a href={`mailto:${open.email}`} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-accent"><Mail className="size-4 text-accent" />Email</a>
              <a href={`tel:${open.phone}`} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-accent"><Phone className="size-4 text-accent" />Call</a>
              <a href={`https://wa.me/${(open.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-emerald-500"><MessageCircle className="size-4 text-emerald-500" />WhatsApp</a>
            </div>
            {open.invoiceUrl && <a href={open.invoiceUrl} target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background"><FileText className="size-4" /> View / download invoice</a>}
            <dl className="mt-6 space-y-3 text-sm">
              {[["Email", open.email], ["Phone", open.phone], ["Company", open.company], ["Status", open.status], ["Method", open.method], ["Payment ID", open.rzp_payment_id], ["Order ID", open.rzp_order_id], ["Created", open.created_at], ["Paid at", open.paid_at]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted">{k}</dt><dd className="text-right font-mono text-xs break-all">{v || "—"}</dd></div>
              ))}
            </dl>
            <p className="mt-6 mb-2 text-xs font-medium text-muted">Client notes / internal notes</p>
            <textarea defaultValue={open.notes ?? ""} onBlur={(e) => patch(open.id, { notes: e.target.value })} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent" />
          </div>
        </div>
      )}
    </div>
  );
}
