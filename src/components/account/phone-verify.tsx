"use client";
import { useState } from "react";
import { Check, Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

/** Add a mobile number to the signed-in account with an SMS OTP. Calls onDone(phone) once verified. */
export function PhoneVerify({ onDone, title = "Verify your mobile number", hint = "We'll send a 6-digit code by SMS.", className = "" }: { onDone: (phone: string) => void; title?: string; hint?: string; className?: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const call = async (body: Record<string, string>) => {
    setBusy(true); setErr("");
    const r = await fetch("/api/account/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || "Something went wrong."); return null; }
    return j as { user?: { phone: string } };
  };
  const field = "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] outline-none focus:border-foreground/50";
  if (done) return <p className={cn("flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700", className)}><Check className="size-4" /> {done} verified</p>;
  return (
    <div className={cn("rounded-2xl border border-border bg-foreground/[.02] p-4", className)}>
      <p className="flex items-center gap-2 text-sm font-bold"><Smartphone className="size-4" /> {title}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div className="mt-3 flex gap-2">
        <span className="grid place-items-center rounded-xl border border-border bg-background px-3 text-sm font-semibold">+91</span>
        <input value={phone} disabled={sent} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Mobile number" className={field} />
      </div>
      {sent && <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" className={cn(field, "mt-2 text-center font-bold tracking-[.5em]")} />}
      {err && <p className="mt-2 text-xs font-semibold text-red-500">{err}</p>}
      <div className="mt-3 flex gap-2">
        {!sent ? (
          <button type="button" disabled={busy || phone.length !== 10} onClick={async () => { if (await call({ action: "send", phone })) setSent(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-40">{busy ? <Loader2 className="size-4 animate-spin" /> : "Send OTP"}</button>
        ) : (
          <>
            <button type="button" disabled={busy || code.length !== 6} onClick={async () => { const r = await call({ action: "verify", phone, code }); if (r) { setDone(`+91 ${phone}`); onDone(r.user?.phone ?? phone); } }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-40">{busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}</button>
            <button type="button" onClick={() => { setSent(false); setCode(""); setErr(""); }} className="rounded-xl border border-border px-3 text-xs font-semibold text-muted">Change</button>
          </>
        )}
      </div>
    </div>
  );
}
