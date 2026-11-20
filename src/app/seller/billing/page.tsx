import { FileText } from "lucide-react";
import { query } from "@/lib/server/db";
import { effectivePlan, GRACE_DAYS } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { UpgradeButton } from "@/components/seller/upgrade-button";
import { fmtDate } from "@/lib/dates";
import { fmtBytes, storageUsage } from "@/lib/server/storage";
import { StorageBar } from "@/components/store/ui";

export const metadata = { title: "Plan & billing" };
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export default async function SellerBilling() {
  const { user, store, cfg } = await requireSeller();
  const eff = effectivePlan(store);
  const plan = cfg.plans[eff];
  const exp = store.plan_expires_at ? new Date(store.plan_expires_at) : null;
  const inGrace = !!exp && exp.getTime() < Date.now() && eff !== "free";
  const left = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null;
  const usage = await storageUsage(store);
  const pays = await query<{ plan_name: string; amount: number; status: string; rzp_order_id: string; paid_at: string | null; created_at: string }>(
    "SELECT plan_name, amount, status, rzp_order_id, paid_at, created_at FROM payments WHERE user_id=? AND kind='subscription' ORDER BY id DESC LIMIT 50", [user.id]);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Plan & billing</h1>
      <section className="relative overflow-hidden rounded-[1.6rem] bg-[#0a0f1f] p-6 text-white md:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.35),transparent)]" />
        <p className="relative text-xs font-bold tracking-[3px] text-white/50">CURRENT PLAN</p>
        <p className="relative mt-2 font-display text-3xl font-extrabold">{plan.name}</p>
        <p className="relative mt-1 text-sm text-white/65">{plan.limit ? `Up to ${plan.limit} products` : "Unlimited products"} · {fmtBytes(plan.storageMb * 1024 * 1024)} storage · {plan.razorpay ? "Online payments (Razorpay) included" : "COD & UPI payments"}</p>
        {exp && <p className={`relative mt-3 text-sm font-semibold ${inGrace ? "text-amber-300" : "text-white/80"}`}>{inGrace ? `Expired on ${fmtDate(exp)} — renew within ${GRACE_DAYS} days to keep these limits` : `Valid till ${fmtDate(exp)} (${left} day${left === 1 ? "" : "s"} left)`}</p>}
        <StorageBar usage={{ ...usage, label: `${fmtBytes(usage.used)} of ${fmtBytes(usage.limit)}` }} className="relative mt-5 max-w-sm [&_.text-muted]:text-white/60 [&_.bg-foreground\/10]:bg-white/15" />
        <div className="relative mt-6"><UpgradeButton plans={cfg.plans} current={eff} storePlan={store.plan} expiresAt={exp && !inGrace ? exp.toISOString() : null} label={eff === "free" ? "Upgrade plan" : "Renew or change plan"} /></div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        {(["starter", "growth", "premium"] as const).map((k) => (
          <div key={k} className={`rounded-2xl border bg-card p-5 ${eff === k ? "border-accent" : "border-border"}`}>
            <p className="font-display text-lg font-bold">{cfg.plans[k].name}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{inr(cfg.plans[k].price)}<span className="text-sm font-medium text-muted">/yr</span></p>
            <p className="mt-1 text-xs text-muted">+ {cfg.gstRate}% GST · {cfg.plans[k].limit ? `${cfg.plans[k].limit} products` : "Unlimited products"} · {fmtBytes(cfg.plans[k].storageMb * 1024 * 1024)} storage</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-4 font-display font-bold">Billing history</h2>
        {pays.length === 0 ? <p className="p-8 text-center text-sm text-muted">No plan payments yet.</p> : (
          <div className="divide-y divide-border">
            {pays.map((p) => (
              <div key={p.rzp_order_id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.plan_name}</p><p className="text-xs text-muted">{fmtDate(p.paid_at ?? p.created_at)} · {p.status === "paid" ? "Paid" : p.status === "created" ? "Not completed" : p.status}</p></div>
                <p className="text-sm font-bold">{inr(Number(p.amount))}</p>
                {p.status === "paid" && <a href={`/api/account/invoice/${encodeURIComponent(p.rzp_order_id)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background"><FileText className="size-3.5" /> GST invoice</a>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
