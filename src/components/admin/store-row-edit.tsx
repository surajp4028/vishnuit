"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

const PLANS = [["free", "Free"], ["starter", "Starter"], ["growth", "Growth"], ["premium", "Premium"]];

/** Inline editor on the Catalog Stores table: change plan + expiry by hand, or suspend a store. */
export function StoreRowEdit({ id, plan, expires, status }: { id: number; plan: string; expires: string | null; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(plan);
  const [d, setD] = useState(expires ? expires.slice(0, 10) : "");
  const [s, setS] = useState(status);
  const [err, setErr] = useState("");
  async function save() {
    setErr("");
    const r = await fetch(`/api/admin/stores/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p, expires: d || null, status: s }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setOpen(false); router.refresh(); } else setErr(j.error || "Could not save");
  }
  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"><Pencil className="size-3" /> Edit</button>;
  return (
    <div className="w-56 space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
      <select value={p} onChange={(e) => setP(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5">{PLANS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {p !== "free" && <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5" />}
      <select value={s} onChange={(e) => setS(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5"><option value="active">Active</option><option value="suspended">Suspended (store hidden)</option></select>
      {err && <p className="text-red-500">{err}</p>}
      <div className="flex gap-2"><button onClick={save} className="flex-1 rounded-full bg-accent py-1.5 font-semibold text-white">Save</button><button onClick={() => setOpen(false)} className="flex-1 rounded-full border border-border py-1.5">Cancel</button></div>
    </div>
  );
}
