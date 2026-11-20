"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PlanKey = "free" | "starter" | "growth" | "premium";
type PlanDef = { name: string; limit: number | null; price: number; razorpay: boolean };
type Features = { enabled: boolean; newStores: boolean; storefronts: boolean; accountCard: boolean; accountTab: boolean; menuLink: boolean };
type Config = { plans: Record<PlanKey, PlanDef>; gstRate: number; sellerGstin: string; sellerLegalName: string; features: Features };

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";
const SWITCHES: [keyof Features, string, string][] = [
  ["enabled", "Catalog feature", "Master switch. Off = no store dashboard, no enroll, no store links anywhere."],
  ["newStores", "Allow new stores", "Users can create a new store. Existing stores keep working."],
  ["storefronts", "Stores are live", "Shoppers can open vishnuit.co.in/catalog/@name pages."],
  ["accountCard", "“Launch your store” card on /account", "Big promo card on the user's account overview."],
  ["accountTab", "Store tab on /account", "“Create Store / My Store” pill next to Overview · Payments · Profile."],
  ["menuLink", "“My store” in profile menu", "Link in the header avatar menu."],
];

export function CatalogSettings({ initial }: { initial: Config }) {
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const setPlan = (k: PlanKey, patch: Partial<PlanDef>) => setC({ ...c, plans: { ...c.plans, [k]: { ...c.plans[k], ...patch } } });

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/catalog-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? { ok: true, t: "Saved — changes are live." } : { ok: false, t: j.error || "Could not save" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Catalog Settings</h1>
        <p className="mt-1 text-sm text-muted">Turn the online-store feature on/off, set plan limits & prices, and GST for plan invoices.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold">Feature switches</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SWITCHES.map(([k, label, help]) => {
            const disabled = k !== "enabled" && !c.features.enabled;
            const on = c.features[k];
            return (
              <button key={k} type="button" disabled={disabled} onClick={() => setC({ ...c, features: { ...c.features, [k]: !on } })} className={cn("flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4 text-left", disabled && "opacity-50", k === "enabled" && "md:col-span-2")}>
                <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-muted">{help}</span></span>
                <span className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", on && !disabled ? "bg-accent" : "bg-foreground/15")}><span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on && !disabled ? "left-[22px]" : "left-0.5")} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold">Plans</h2>
        <p className="mt-1 text-xs text-muted">Yearly price (before GST). Leave product limit empty for unlimited. Users can buy 1–4 years at once.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {(["free", "starter", "growth", "premium"] as PlanKey[]).map((k) => (
            <div key={k} className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-bold tracking-widest text-muted uppercase">{k}</p>
              <label className="block"><span className="mb-1 block text-xs text-muted">Name</span><input value={c.plans[k].name ?? ""} onChange={(e) => setPlan(k, { name: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-xs text-muted">Product limit</span><input value={c.plans[k].limit ?? ""} onChange={(e) => setPlan(k, { limit: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })} placeholder="Unlimited" className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-xs text-muted">Price / year (₹)</span><input value={k === "free" ? 0 : c.plans[k].price} disabled={k === "free"} onChange={(e) => setPlan(k, { price: Number(e.target.value.replace(/\D/g, "")) })} className={inputCls} /></label>
              {k !== "free" && (
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={c.plans[k].razorpay} onChange={(e) => setPlan(k, { razorpay: e.target.checked })} /> Allow merchant Razorpay checkout</label>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-3">
        <label className="block"><span className="mb-1 block text-xs text-muted">GST rate on plans (%)</span><input value={c.gstRate} onChange={(e) => setC({ ...c, gstRate: Number(e.target.value.replace(/[^\d.]/g, "")) })} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Your GSTIN (printed on invoices)</span><input value={c.sellerGstin ?? ""} onChange={(e) => setC({ ...c, sellerGstin: e.target.value.toUpperCase() })} placeholder="07ABCDE1234F1Z5" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">Legal business name (optional)</span><input value={c.sellerLegalName ?? ""} onChange={(e) => setC({ ...c, sellerLegalName: e.target.value })} className={inputCls} /></label>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button onClick={save} disabled={busy} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60">{busy ? "Saving…" : "Save catalog settings"}</button>
        {msg && <span className={cn("text-sm font-medium", msg.ok ? "text-emerald-600" : "text-red-500")}>{msg.t}</span>}
      </div>
    </div>
  );
}
