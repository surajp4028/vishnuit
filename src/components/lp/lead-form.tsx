"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
const BUDGETS = ["Under ₹10k", "₹10k – ₹20k", "₹20k – ₹40k", "₹40k+"];

/** Keep ad attribution for the whole visit (Meta often lands on one page, user submits on another). */
function readAttribution() {
  const out: Record<string, string> = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem("vit_attr") || "{}");
    Object.assign(out, saved);
  } catch {}
  const q = new URLSearchParams(window.location.search);
  let changed = false;
  for (const k of UTM_KEYS) {
    const v = q.get(k);
    if (v) { out[k] = v; changed = true; }
  }
  if (!out.referrer && document.referrer && !document.referrer.includes(window.location.host)) { out.referrer = document.referrer; changed = true; }
  if (changed) try { sessionStorage.setItem("vit_attr", JSON.stringify(out)); } catch {}
  return out;
}

const field = "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-[15px] text-[#0a0f1f] outline-none transition placeholder:text-[#8a93a6] focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/15 dark:bg-[#0b0f1a] dark:text-white";

export function LeadForm({ services, defaultService, cta = "Get my free quote", id = "lead-form", compact }: { services: string[]; defaultService?: string; cta?: string; id?: string; compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState("");
  const [attr, setAttr] = useState<Record<string, string>>({});
  useEffect(() => setAttr(readAttribution()), []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const digits = (data.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) { setError("Please enter a valid 10-digit mobile number."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/lp-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, phone: `+91${digits}`, budget, page: pathname, ...attr }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong");
      window.fbq?.("track", "Lead", { content_name: data.service || "Website", content_category: pathname.replace(/^\//, "") || "landing", currency: "INR" }, { eventID: j.eventId });
      try { sessionStorage.setItem("vit_lead", JSON.stringify({ id: j.eventId, lp: pathname.replace(/^\//, "") || "landing", service: data.service || "" })); } catch {}
      router.push(`/thank-you?n=${encodeURIComponent(data.name.split(" ")[0])}&from=${encodeURIComponent(pathname)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-3">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" required minLength={2} autoComplete="name" placeholder="Your name *" className={field} />
      <div className="flex overflow-hidden rounded-xl border border-border bg-white focus-within:border-[#1d4ed8] focus-within:ring-4 focus-within:ring-blue-500/15 dark:bg-[#0b0f1a]">
        <span className="grid shrink-0 place-items-center border-r border-border px-3.5 text-[15px] font-semibold whitespace-nowrap text-[#5b6475]">🇮🇳 +91</span>
        <input name="phone" required inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="WhatsApp number *" className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#0a0f1f] outline-none placeholder:text-[#8a93a6] dark:text-white" />
      </div>
      {!compact && <input name="email" type="email" autoComplete="email" placeholder="Email (optional)" className={field} />}
      <select name="service" defaultValue={defaultService ?? ""} className={cn(field, "appearance-none")}>
        <option value="">What do you need?</option>
        {services.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {!compact && (
        <div>
          <p className="mb-2 text-xs font-medium text-[#5b6475]">Your budget</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUDGETS.map((b) => (
              <button key={b} type="button" onClick={() => setBudget(budget === b ? "" : b)} className={cn("rounded-lg border px-2 py-2 text-xs font-semibold transition", budget === b ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-border bg-white text-[#3c4558] hover:border-[#1d4ed8]/50 dark:bg-transparent dark:text-white/80")}>{b}</button>
            ))}
          </div>
        </div>
      )}
      {!compact && <input name="city" autoComplete="address-level2" placeholder="City (optional)" className={field} />}
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#d4a017] to-[#f5c542] py-4 text-base font-extrabold text-[#0a0f1f] shadow-[0_12px_30px_-10px_rgba(212,160,23,0.8)] transition hover:brightness-105 disabled:opacity-60">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {busy ? <Loader2 className="size-5 animate-spin" /> : <>{cta} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></>}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#5b6475]">
        <Lock className="size-3.5" /> 100% secure · No spam · Reply within 30 minutes
      </p>
    </form>
  );
}

export function TrustLine({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-[#5b6475]", className)}>
      <ShieldCheck className="size-4 text-emerald-600" /> Trusted by 120+ businesses across India
    </p>
  );
}
