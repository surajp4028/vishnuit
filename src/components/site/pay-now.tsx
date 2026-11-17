"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Download, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { loadRazorpay } from "./plan-checkout";

const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";
const PURPOSES = ["Advance payment", "Balance payment", "Website development", "E-commerce store", "Maintenance / support", "Domain & hosting", "Digital marketing", "Other"];

/** Header "Pay Now": customer enters any amount, pays via Razorpay and downloads an invoice. */
export function PayNowButton({ showOnMobile }: { showOnMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<"form" | "paying" | "done">("form");
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  useEffect(() => setMounted(true), []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  const amt = Math.round(Number(amount) || 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (amt < 1) return setError("Please enter the amount to pay.");
    setState("paying");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const [ok, res] = await Promise.all([
      loadRazorpay(),
      fetch("/api/payments/custom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, amount: amt }) }),
    ]);
    const order = await res.json().catch(() => ({}));
    if (!ok || !window.Razorpay) { setError("Could not load the payment window. Check your connection."); setState("form"); return; }
    if (!res.ok) { setError(order.error || "Could not start payment."); setState("form"); return; }
    const rzp = new window.Razorpay({
      key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
      name: "Vishnu IT Solutions", description: data.purpose || "Payment", image: "/icon.png",
      prefill: { name: data.name, email: data.email, contact: data.phone },
      theme: { color: "#0a0f1f" },
      handler: async (r: Record<string, string>) => {
        const v = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
        const j = await v.json().catch(() => ({}));
        if (v.ok) { setInvoiceUrl(j.invoiceUrl || ""); setState("done"); }
        else { setError("Payment received but verification failed — we'll confirm manually. Please contact us."); setState("form"); }
      },
      modal: { ondismiss: () => setState("form") },
    });
    rzp.on("payment.failed", (r) => { setError(r.error?.description || "Payment failed. Please try again."); setState("form"); });
    rzp.open();
  }

  const close = () => { if (state === "paying") return; setOpen(false); if (state === "done") { setState("form"); setAmount(""); setInvoiceUrl(""); } };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-card p-6 text-foreground shadow-2xl sm:rounded-[2rem] sm:p-8">
            {state === "done" ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-8" /></div>
                <h3 className="font-display text-2xl font-bold">Payment successful 🎉</h3>
                <p className="mt-2 text-sm text-muted">Thank you! We&apos;ve received {formatINR(amt)}. A copy of your invoice has also been emailed to you.</p>
                {invoiceUrl && (
                  <a href={invoiceUrl} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"><Download className="size-4" /> Download invoice</a>
                )}
                <button onClick={close} className="mt-3 block w-full text-sm font-medium text-muted hover:text-foreground">Close</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-accent uppercase">Pay now</p>
                    <h3 className="mt-1 font-display text-2xl font-bold">Make a payment</h3>
                    <p className="mt-1 text-sm text-muted">Pay Vishnu IT Solutions securely and get an instant invoice.</p>
                  </div>
                  <button type="button" onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-border"><X className="size-4" /></button>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Amount (₹)</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold">₹</span>
                    <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} inputMode="numeric" required placeholder="0" className={cn(field, "pl-9 text-lg font-bold")} />
                  </div>
                </label>
                <select name="purpose" defaultValue="Advance payment" className={field}>{PURPOSES.map((p) => <option key={p}>{p}</option>)}</select>
                <input name="name" required placeholder="Full name" className={field} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="email" type="email" required placeholder="Email (invoice is sent here)" className={field} />
                  <input name="phone" required inputMode="tel" placeholder="Phone" className={field} />
                </div>
                <input name="company" placeholder="Company / GSTIN (optional)" className={field} />
                {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>}
                <button disabled={state === "paying"} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background disabled:opacity-60">
                  {state === "paying" ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Pay {amt ? formatINR(amt) : ""} securely</>}
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
      <button onClick={() => setOpen(true)}
        className={cn("items-center rounded-full border border-black bg-white px-4 py-[7px] text-sm font-semibold text-black transition hover:bg-black hover:text-white dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-black",
          showOnMobile ? "inline-flex" : "hidden sm:inline-flex")}>
        Pay Now
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
