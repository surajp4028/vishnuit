"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CouponRow = {
  id: number; code: string; kind: "percent" | "flat"; value: number; plan: string | null; max_uses: number | null; used: number;
  valid_till: string | null; active: number; note: string | null; user_uid: string | null; user_name: string | null;
};
const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

export function CouponsManager({ rows }: { rows: CouponRow[] }) {
  const router = useRouter();
  const [f, setF] = useState({ code: "", kind: "percent", value: "", user: "", plan: "", max_uses: "", valid_till: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, t: `Coupon ${f.code.toUpperCase()} created.` }); setF({ ...f, code: "", value: "", user: "", note: "" }); router.refresh(); }
    else setMsg({ ok: false, t: j.error || "Could not create" });
  }
  async function toggle(c: CouponRow) {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !Number(c.active) }) });
    router.refresh();
  }
  async function remove(c: CouponRow) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Coupons</h1>
        <p className="mt-1 text-sm text-muted">Discounts for catalog plan purchases. Lock a coupon to one user to give someone a personal deal.</p>
      </div>
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
        <label className="block"><span className="mb-1 block text-xs text-muted">Code</span><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} required placeholder="WELCOME20" className={cn(inputCls, "uppercase")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Type</span>
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={inputCls}><option value="percent">% off</option><option value="flat">₹ off</option></select></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">{f.kind === "percent" ? "Percent" : "Amount (₹)"}</span><input value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/[^\d.]/g, "") })} required className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Only for plan (optional)</span>
          <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className={inputCls}><option value="">Any paid plan</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="premium">Premium</option></select></label>
        <label className="block md:col-span-2"><span className="mb-1 block text-xs text-muted">Only for user (optional) — VISHNU ID, email or phone</span><input value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} placeholder="Leave empty for everyone" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Max uses (optional)</span><input value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value.replace(/\D/g, "") })} placeholder="Unlimited" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Valid till (optional)</span><input type="date" value={f.valid_till} onChange={(e) => setF({ ...f, valid_till: e.target.value })} className={inputCls} /></label>
        <label className="block md:col-span-3"><span className="mb-1 block text-xs text-muted">Note (internal)</span><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Diwali offer" className={inputCls} /></label>
        <div className="flex items-end"><button disabled={busy} className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Creating…" : "Create coupon"}</button></div>
        {msg && <p className={cn("text-sm font-medium md:col-span-4", msg.ok ? "text-emerald-600" : "text-red-500")}>{msg.t}</p>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">{["Code", "Discount", "For", "Used", "Valid till", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><p className="font-mono font-semibold">{c.code}</p>{c.note && <p className="text-xs text-muted">{c.note}</p>}</td>
                <td className="px-4 py-3">{c.kind === "percent" ? `${Number(c.value)}% off` : `₹${Number(c.value).toLocaleString("en-IN")} off`}</td>
                <td className="px-4 py-3 text-xs">{c.user_uid ? <span className="font-semibold">{c.user_name || c.user_uid} <span className="font-mono text-muted">{c.user_uid}</span></span> : "Everyone"}{c.plan ? <span className="block text-muted capitalize">{c.plan} only</span> : null}</td>
                <td className="px-4 py-3">{c.used}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="px-4 py-3 text-xs">{c.valid_till ? new Date(c.valid_till).toLocaleDateString("en-IN") : "—"}</td>
                <td className="px-4 py-3"><button onClick={() => toggle(c)} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", Number(c.active) ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/10 text-muted")}>{Number(c.active) ? "Active" : "Off"}</button></td>
                <td className="px-4 py-3"><button onClick={() => remove(c)} aria-label="Delete" className="text-muted hover:text-red-500"><Trash2 className="size-4" /></button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
