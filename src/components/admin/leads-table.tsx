"use client";
import { useMemo, useState } from "react";
import { Download, Mail, MessageCircle, Phone, Search, Trash2, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export type Lead = {
  id: number; name: string; email: string; phone: string; service: string; budget: string; message: string;
  source: string; page: string; status: string; city?: string | null; utm?: string | null; notes: string | null; emailed: number; created_at: string;
};
const STATUSES = ["new", "contacted", "qualified", "won", "lost"];
const COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  qualified: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function LeadsTable({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<Lead | null>(null);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return leads.filter((l) => (filter === "all" || l.status === filter) && (!s || [l.name, l.email, l.phone, l.service, l.message].join(" ").toLowerCase().includes(s)));
  }, [leads, q, filter]);
  const count = (s: string) => leads.filter((l) => l.status === s).length;
  const conv = leads.length ? ((count("won") / leads.length) * 100).toFixed(1) : "0.0";

  async function patch(id: number, data: Partial<Lead>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...data } : l)));
    if (open?.id === id) setOpen((o) => (o ? { ...o, ...data } : o));
    await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }
  async function remove(id: number) {
    if (!confirm("Delete this lead permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    setLeads((ls) => ls.filter((l) => l.id !== id));
    setOpen(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Leads & Conversions</h1>
          <p className="text-sm text-muted">{leads.length} total · {count("won")} won · <span className="font-semibold text-emerald-600">{conv}% conversion</span></p>
        </div>
        <a href="/api/admin/leads/export" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent"><Download className="size-4" /> Export CSV</a>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition", filter === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted hover:text-foreground")}>
            {s} ({s === "all" ? leads.length : count(s)})
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 text-sm outline-none focus:border-accent" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {list.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-foreground/[0.03] text-left text-xs text-muted">
                <tr><th className="px-4 py-3 font-medium">Lead</th><th className="px-4 py-3 font-medium">Service / budget</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Received</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l.id} className="cursor-pointer border-t border-border hover:bg-foreground/[0.02]" onClick={() => setOpen(l)}>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-2 font-medium">{l.status === "new" && <span className="size-2 rounded-full bg-blue-500" />}{l.name}</p>
                      <p className="text-xs text-muted">{l.email}{l.phone ? ` · ${l.phone}` : ""}</p>
                    </td>
                    <td className="px-4 py-3"><p>{l.service || "—"}</p><p className="text-xs text-muted">{l.budget || ""}</p></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium capitalize outline-none", COLORS[l.status])}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(l.created_at)}<br /><span className={l.source?.startsWith("lp:") ? "font-semibold text-[#d4a017]" : ""}>{l.source?.startsWith("lp:") ? "📣 Ad LP" : l.source}</span></td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(l.id)} className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-500" aria-label="Delete"><Trash2 className="size-4" /></button>
                    </td>
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
              <div><h2 className="font-display text-xl font-bold">{open.name}</h2><p className="text-xs text-muted">Received {new Date(open.created_at.replace(" ", "T")).toLocaleString("en-IN")}</p></div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <a href={`mailto:${open.email}`} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-accent"><Mail className="size-4 text-accent" />Email</a>
              <a href={open.phone ? `tel:${open.phone}` : undefined} className={cn("flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-accent", !open.phone && "pointer-events-none opacity-40")}><Phone className="size-4 text-accent" />Call</a>
              <a href={open.phone ? `https://wa.me/${open.phone.replace(/\D/g, "")}` : undefined} target="_blank" rel="noopener noreferrer" className={cn("flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs hover:border-emerald-500", !open.phone && "pointer-events-none opacity-40")}><MessageCircle className="size-4 text-emerald-500" />WhatsApp</a>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              {[["Email", open.email], ["Phone", open.phone], ["Service", open.service], ["Budget", open.budget], ["City", open.city], ["Source", open.source], ["Page", open.page], ...Object.entries((() => { try { return JSON.parse(open.utm || "{}") as Record<string, string>; } catch { return {}; } })()).filter(([, v]) => v).map(([k, v]) => [k.replace("utm_", "UTM ").replace("fbclid", "FB click ID"), v]), ["Email alert", open.emailed ? "Sent ✓" : "Not sent"]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted">{k}</dt><dd className="text-right break-all">{v || "—"}</dd></div>
              ))}
            </dl>
            <p className="mt-6 mb-2 text-xs font-medium text-muted">Message</p>
            <p className="rounded-xl bg-foreground/[0.04] p-4 text-sm whitespace-pre-wrap">{open.message}</p>
            <p className="mt-6 mb-2 text-xs font-medium text-muted">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => patch(open.id, { status: s })} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize", open.status === s ? COLORS[s] : "border-border text-muted")}>{s}</button>
              ))}
            </div>
            <p className="mt-6 mb-2 text-xs font-medium text-muted">Internal notes</p>
            <textarea defaultValue={open.notes ?? ""} onBlur={(e) => patch(open.id, { notes: e.target.value })} rows={4} placeholder="Call notes, quote sent, follow-up date…" className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent" />
            <button onClick={() => remove(open.id)} className="mt-6 inline-flex items-center gap-2 text-sm text-red-500"><Trash2 className="size-4" /> Delete lead</button>
          </div>
        </div>
      )}
    </div>
  );
}
