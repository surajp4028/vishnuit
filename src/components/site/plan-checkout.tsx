"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle2, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";

export function PlanCheckout({ plan, highlighted }: { plan: { id: number; name: string; price: number; cta: string }; highlighted?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<"form" | "paying" | "done">("form");
  const [error, setError] = useState("");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("paying");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const [ok, res] = await Promise.all([
      loadScript(),
      fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, planId: plan.id }) }),
    ]);
    const order = await res.json().catch(() => ({}));
    if (!ok || !window.Razorpay) { setError("Could not load the payment window. Check your connection."); setState("form"); return; }
    if (!res.ok) { setError(order.error || "Could not start payment."); setState("form"); return; }

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Vishnu IT Solutions",
      description: `${plan.name} plan`,
      image: "/icon.png",
      prefill: { name: data.name, email: data.email, contact: data.phone },
      notes: { plan: plan.name },
      theme: { color: "#1d4ed8" },
      handler: async (r: Record<string, string>) => {
        const v = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
        if (v.ok) setState("done");
        else { setError("Payment received but verification failed — we'll confirm manually. Please contact us."); setState("form"); }
      },
      modal: { ondismiss: () => setState("form") },
    });
    rzp.on("payment.failed", (r) => { setError(r.error?.description || "Payment failed. Please try again."); setState("form"); });
    rzp.open();
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => state !== "paying" && setOpen(false)}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-card p-6 text-foreground shadow-2xl sm:rounded-[2rem] sm:p-8"
          >
            {state === "done" ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-8" /></div>
                <h3 className="font-display text-2xl font-bold">Payment successful 🎉</h3>
                <p className="mt-2 text-sm text-muted">Welcome aboard! A receipt is on its way to your inbox and our team will call you within 24 hours to kick off your {plan.name} project.</p>
                <button onClick={() => { setOpen(false); setState("form"); }} className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-accent uppercase">Checkout</p>
                    <h3 className="mt-1 font-display text-2xl font-bold">{plan.name} plan</h3>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-border"><X className="size-4" /></button>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-foreground/[0.04] px-4 py-3">
                  <span className="text-sm text-muted">Amount payable</span>
                  <span className="font-display text-2xl font-extrabold">{formatINR(plan.price)}</span>
                </div>
                <input name="name" required minLength={2} placeholder="Full name *" className={field} />
                <input name="email" type="email" required placeholder="Email *" className={field} />
                <input name="phone" type="tel" required placeholder="Phone / WhatsApp *" className={field} />
                <input name="company" placeholder="Company / brand (optional)" className={field} />
                <textarea name="notes" rows={2} placeholder="Anything we should know? (optional)" className={cn(field, "resize-none")} />
                {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>}
                <button disabled={state === "paying"} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 disabled:opacity-60">
                  {state === "paying" ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Pay {formatINR(plan.price)} securely</>}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted"><ShieldCheck className="size-3.5 text-emerald-500" /> UPI, cards, net-banking & wallets via Razorpay</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="relative mt-9 grid gap-2">
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.02]",
            highlighted ? "bg-gradient-to-r from-[#d4a017] to-[#f5c542] text-black" : "bg-foreground text-background",
          )}
        >
          Buy {plan.name} — {formatINR(plan.price)} <ArrowRight className="size-4" />
        </button>
        <Link href={`/contact?plan=${encodeURIComponent(plan.name)}`} className={cn("text-center text-xs font-medium underline-offset-4 hover:underline", highlighted ? "text-white/70" : "text-muted")}>
          or {plan.cta.toLowerCase()} — talk to us first
        </Link>
      </div>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
