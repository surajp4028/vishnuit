"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BUDGETS = ["Under ₹10k", "₹10k – ₹20k", "₹20k – ₹40k", "₹40k – ₹1L", "₹1L+", "Not sure yet"];

const field =
  "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";

export function ContactForm({ services, defaultService, defaultMessage, compact }: { services: string[]; defaultService?: string; defaultMessage?: string; compact?: boolean }) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const [budget, setBudget] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("loading");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, budget, page: pathname, source: compact ? "quick-form" : "contact" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "Lead", { content_name: String(data.service || "Website enquiry") });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-2xl font-bold">Thank you! 🎉</h3>
            <p className="mt-2 max-w-sm text-muted">We&apos;ve received your enquiry and will get back to you within 24 hours.</p>
            <button onClick={() => setState("idle")} className="mt-6 text-sm font-semibold text-accent hover:underline">Send another message</button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Full name *</span>
                <input name="name" required minLength={2} placeholder="Your name" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Email *</span>
                <input name="email" type="email" required placeholder="you@company.com" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Phone / WhatsApp</span>
                <input name="phone" type="tel" placeholder="+91 98xxxxxx" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Service</span>
                <select name="service" defaultValue={defaultService ?? ""} className={cn(field, "appearance-none")}>
                  <option value="">Select a service</option>
                  {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
            {!compact && (
              <div>
                <span className="mb-2 block text-xs font-medium text-muted">Budget</span>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setBudget(budget === b ? "" : b)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                        budget === b ? "border-accent bg-accent text-white" : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-foreground",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Project details *</span>
              <textarea name="message" defaultValue={defaultMessage} required minLength={5} rows={compact ? 3 : 5} placeholder="Tell us about your goals, timeline and anything else…" className={cn(field, "resize-none")} />
            </label>
            {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>}
            <button
              disabled={state === "loading"}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <>Send enquiry <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
            <p className="text-center text-xs text-muted">We reply within 24 hours. Your details are never shared.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
