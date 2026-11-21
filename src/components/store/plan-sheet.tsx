"use client";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Crown, Loader2, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadRazorpay } from "@/components/site/plan-checkout";
import { api, btnDark, inr, input } from "./ui";
import { fmtDate } from "@/lib/dates";

type PlanKey = "free" | "starter" | "growth" | "premium";
type PlanDef = { name: string; limit: number | null; price: number; razorpay: boolean; storageMb?: number };
const gb = (mb?: number) => (!mb ? "" : mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb} MB`);
type Quote = { planName: string; years: number; unit: number; base: number; discount: number; coupon: string | null; taxable: number; gstRate: number; gst: number; total: number };

/** Upgrade / renew: pick plan + 1–4 years, apply coupon, see GST, pay with Razorpay. */
/**
 * inline: render as a card on a page (the payment page for stores on their own domain) instead of a popup.
 * returnUrl: after the payment succeeds or fails, send the seller back here (?payment=success|failed).
 */
export function PlanSheet({ plans, current, storePlan, expiresAt, onClose, inline, returnUrl }: { plans: Record<PlanKey, PlanDef>; current: PlanKey; storePlan?: PlanKey; expiresAt?: string | null; onClose: () => void; inline?: boolean; returnUrl?: string }) {
  const back = (result: "success" | "failed") => { if (returnUrl) window.location.href = `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}payment=${result}`; };
  const paid = (["starter", "growth", "premium"] as PlanKey[]);
  const [plan, setPlan] = useState<PlanKey>(current === "free" ? "growth" : current);
  const [years, setYears] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      const r = await api<{ quote: Quote; error?: string }>("/api/store/plan/quote", "POST", { plan, years, coupon: applied });
      if (off) return;
      if (r.ok) { setQuote(r.data.quote); setErr(""); }
      else { setErr(r.data.error || "Could not price this plan."); if (applied) setApplied(""); }
    })();
    return () => { off = true; };
  }, [plan, years, applied]);

  async function pay() {
    setErr(""); setBusy(true);
    const [ok, r] = await Promise.all([loadRazorpay(), api<{ orderId: string; amount: number; currency: string; keyId: string; label: string; prefill: Record<string, string> }>("/api/store/plan/order", "POST", { plan, years, coupon: applied })]);
    if (!r.ok) { setBusy(false); return setErr(r.data.error || "Could not start payment."); }
    if (!ok || !window.Razorpay) { setBusy(false); return setErr("Could not load the payment window."); }
    const o = r.data;
    const rzp = new window.Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
      name: "Vishnu IT Solutions", description: o.label, image: "/icon.png", prefill: o.prefill, theme: { color: "#0a0f1f" },
      handler: async (res: Record<string, string>) => {
        const v = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(res) });
        setBusy(false);
        if (v.ok) { setDone(true); if (returnUrl) setTimeout(() => back("success"), 2200); } else setErr("Payment received but not confirmed yet — it will update shortly. Contact us if it doesn't.");
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (x) => { setBusy(false); setErr(x.error?.description || "Payment failed."); if (returnUrl) setTimeout(() => back("failed"), 2500); });
    rzp.open();
  }

  return (
    <div className={inline ? "text-foreground" : "fixed inset-0 z-[80] flex flex-col bg-background text-foreground sm:items-center sm:justify-center sm:bg-black/50 sm:p-6"}>
      <div className={inline ? "flex flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)]" : "flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[94dvh] sm:max-w-2xl sm:rounded-[2rem] sm:border sm:border-border"}>
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => (returnUrl ? (window.location.href = returnUrl) : done ? window.location.reload() : onClose())} aria-label={returnUrl ? "Back to my dashboard" : "Close"} className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><ChevronLeft className={cn("size-5", !returnUrl && "sm:hidden")} />{!returnUrl && <X className="hidden size-5 sm:block" />}</button>
          <h2 className="flex-1 font-display text-lg font-bold">{current === "free" ? "Upgrade your store" : "Renew or change plan"}</h2>
        </header>
        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="size-10" /></div>
            <h3 className="mt-6 font-display text-2xl font-extrabold">You&apos;re on {quote?.planName}! 🎉</h3>
            <p className="mt-2 text-sm text-muted">Your new limits are live. The GST invoice is in My account → Payments.</p>
            {returnUrl && <p className="mt-1 text-xs text-muted">Taking you back to your dashboard…</p>}
            <button onClick={() => (returnUrl ? back("success") : window.location.reload())} className={cn(btnDark, "mt-8")}>Back to my store</button>
          </div>
        ) : (
          <>
            <div className={cn("flex-1 space-y-6 px-4 py-5 sm:px-6", !inline && "overflow-y-auto")}>
              <div className="grid gap-3">
                {paid.map((k) => {
                  const p = plans[k];
                  return (
                    <button key={k} onClick={() => setPlan(k)} className={cn("flex items-center gap-4 rounded-[1.4rem] border-2 p-4 text-left transition", plan === k ? "border-foreground" : "border-border")}>
                      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", k === "premium" ? "bg-amber-400/20 text-amber-600" : "bg-foreground/5")}>{k === "premium" ? <Crown className="size-5" /> : <span className="font-display font-bold">{p.limit}</span>}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-display text-lg font-bold">{p.name}{current === k && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">CURRENT</span>}</span>
                        <span className="block text-xs text-muted">{p.limit == null ? "Unlimited products" : `Up to ${p.limit} products`}{p.storageMb ? ` · ${gb(p.storageMb)} storage` : ""} · Razorpay checkout · UPI & COD</span>
                      </span>
                      <span className="text-right"><span className="block font-display text-lg font-bold">{inr(p.price)}</span><span className="text-[11px] text-muted">/year + GST</span></span>
                    </button>
                  );
                })}
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold">Duration</p>
                <div className="grid grid-cols-4 rounded-full border border-border p-1 text-sm font-semibold">
                  {[1, 2, 3, 4].map((y) => <button key={y} onClick={() => setYears(y)} className={cn("rounded-full py-2.5", years === y ? "bg-foreground text-background" : "text-muted")}>{y} yr{y > 1 ? "s" : ""}</button>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold">Coupon</p>
                <div className="flex gap-2">
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Have a code?" className={cn(input, "py-2.5 uppercase")} />
                  {applied ? <button onClick={() => { setApplied(""); setCoupon(""); }} className="shrink-0 rounded-full border border-border px-4 text-sm font-semibold">Remove</button> : <button onClick={() => coupon.trim() && setApplied(coupon.trim())} className="shrink-0 rounded-full border border-border px-5 text-sm font-semibold">Apply</button>}
                </div>
              </div>
              {quote && (
                <div className="space-y-2 rounded-[1.4rem] bg-foreground/[.03] p-5 text-sm">
                  <div className="flex justify-between text-muted"><span>{quote.planName} · {inr(quote.unit)} × {quote.years} yr</span><span>{inr(quote.base)}</span></div>
                  {quote.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon {quote.coupon}</span><span>− {inr(quote.discount)}</span></div>}
                  <div className="flex justify-between text-muted"><span>Taxable value</span><span>{inr(quote.taxable)}</span></div>
                  <div className="flex justify-between text-muted"><span>GST @ {quote.gstRate}%</span><span>{inr(quote.gst)}</span></div>
                  <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold"><span>Total</span><span>{inr(quote.total)}</span></div>
                </div>
              )}
              {(() => {
                // Same rule as activation on the server: renewing the same plan before it ends adds the years on top.
                const cur = expiresAt ? new Date(expiresAt) : null;
                const stacks = !!cur && (storePlan ?? current) === plan && cur.getTime() > Date.now();
                const end = new Date(stacks ? cur! : new Date());
                end.setFullYear(end.getFullYear() + years);
                const leftDays = stacks ? Math.ceil((cur!.getTime() - Date.now()) / 86400000) : 0;
                return (
                  <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-500/30 bg-emerald-500/[.06] p-4 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">{plans[plan].name} valid till <b>{fmtDate(end)}</b></p>
                      <p className="mt-0.5 text-xs text-muted">{stacks ? `Your ${leftDays} remaining day${leftDays === 1 ? "" : "s"} (till ${fmtDate(cur)}) + ${years} year${years > 1 ? "s" : ""}.` : `Starts today + ${years} year${years > 1 ? "s" : ""}.${cur && cur.getTime() > Date.now() && (storePlan ?? current) !== plan ? ` Your current ${plans[storePlan ?? current].name} plan ends now.` : ""}`}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <footer className="border-t border-border p-4">
              {err && <p className="mb-3 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
              <button onClick={pay} disabled={busy || !quote} className={cn(btnDark, "w-full py-3.5")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Pay {quote ? inr(quote.total) : ""} securely</>}</button>
              <p className="mt-2 text-center text-[11px] text-muted">Plan starts right after payment{current === plan ? " (added on top of your current plan)" : ""}. GST invoice included.</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
