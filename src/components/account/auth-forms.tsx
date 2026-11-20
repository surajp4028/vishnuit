"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";
const btn = "flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-60";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="relative isolate px-4 pt-32 pb-20 md:pt-40">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)] blur-2xl" />
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-[0_40px_90px_-50px_rgba(10,15,31,.45)] sm:p-9">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

function Err({ msg }: { msg: string }) {
  return msg ? <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{msg}</p> : null;
}

function Password({ name = "password", placeholder = "Password", autoComplete = "current-password" }: { name?: string; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required minLength={8} placeholder={placeholder} autoComplete={autoComplete} className={cn(field, "pr-12")} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show password" className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, ...j } as { ok: boolean; error?: string; code?: string };
}

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export function LoginForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = safeNext(sp.get("next"));
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [otpId, setOtpId] = useState("");
  const [sent, setSent] = useState(false);

  async function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const r = await post("/api/account/login", d);
    setBusy(false);
    if (r.ok) { router.replace(next); router.refresh(); } else setErr(r.error || "Could not log in.");
  }
  async function sendOtp() {
    setErr(""); setBusy(true);
    const r = await post("/api/account/otp/send", { id: otpId });
    setBusy(false);
    if (r.ok) setSent(true); else setErr(r.error || "Could not send OTP.");
  }
  async function onOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    const r = await post("/api/account/otp/verify", { id: otpId, code });
    setBusy(false);
    if (r.ok) { router.replace(next); router.refresh(); } else setErr(r.error || "Wrong code.");
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-full border border-border bg-background p-1 text-sm font-semibold">
        {(["password", "otp"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setErr(""); }} className={cn("rounded-full py-2.5 transition", mode === m ? "bg-foreground text-background" : "text-muted")}>
            {m === "password" ? "Password" : "OTP"}
          </button>
        ))}
      </div>
      {mode === "password" ? (
        <form onSubmit={onPassword} className="space-y-4">
          <input name="id" required placeholder="Email or mobile number" autoComplete="username" className={field} />
          <Password />
          <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">Forgot password?</Link></div>
          <Err msg={err} />
          <button disabled={busy} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <>Log in <ArrowRight className="size-4" /></>}</button>
        </form>
      ) : (
        <form onSubmit={onOtp} className="space-y-4">
          <input value={otpId} onChange={(e) => setOtpId(e.target.value.trim())} required placeholder="Mobile number or email" autoComplete="username" className={field} disabled={sent} />
          <p className="-mt-2 text-xs text-muted">{sent ? `Code sent to ${otpId}. It's valid for 10 minutes.` : "We'll send a 6-digit code by SMS or email."}</p>
          {sent && <input name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} placeholder="6-digit OTP" className={cn(field, "text-center text-lg font-bold tracking-[.5em]")} />}
          <Err msg={err} />
          {sent ? (
            <>
              <button disabled={busy} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <>Verify & log in <ArrowRight className="size-4" /></>}</button>
              <button type="button" onClick={() => { setSent(false); setErr(""); }} className="w-full text-sm text-muted hover:text-foreground">Change mobile / email</button>
            </>
          ) : (
            <button type="button" disabled={busy || otpId.length < 6} onClick={sendOtp} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Phone className="size-4" /> Send OTP</>}</button>
          )}
        </form>
      )}
      <p className="text-center text-sm text-muted">New here? <Link href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-foreground hover:underline">Create an account</Link></p>
    </div>
  );
}

export function RegisterForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = safeNext(sp.get("next"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [exists, setExists] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setExists(false); setBusy(true);
    const r = await post("/api/account/register", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (r.ok) { router.replace(next); router.refresh(); return; }
    setErr(r.error || "Could not create account."); setExists(r.code === "exists");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="name" required placeholder="Full name" autoComplete="name" className={field} />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={field} />
      <div className="flex gap-2">
        <span className="grid place-items-center rounded-xl border border-border bg-background px-3.5 text-sm font-semibold">+91</span>
        <input name="phone" inputMode="numeric" required maxLength={10} placeholder="Mobile number" autoComplete="tel-national" className={field} />
      </div>
      <Password placeholder="Create password (8+ characters)" autoComplete="new-password" />
      <Err msg={err} />
      {exists && <Link href="/forgot-password" className="block text-center text-sm font-semibold text-accent hover:underline">Set / reset my password →</Link>}
      <button disabled={busy} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <>Create account <ArrowRight className="size-4" /></>}</button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5 text-emerald-500" /> Your details are private and never shared.</p>
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-foreground hover:underline">Log in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await post("/api/account/forgot", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (r.ok) setDone(true); else setErr(r.error || "Something went wrong.");
  }
  if (done)
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><Mail className="size-6" /></div>
        <p className="text-sm text-muted">If an account exists for this email, a link to set your password is on its way. It works for 30 minutes — check spam too.</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-accent hover:underline">Back to login</Link>
      </div>
    );
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="email" type="email" required placeholder="Your email" autoComplete="email" className={field} />
      <Err msg={err} />
      <button disabled={busy} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <>Send reset link <ArrowRight className="size-4" /></>}</button>
      <p className="text-center text-sm text-muted">Only have a mobile number? <Link href="/login" className="font-semibold text-foreground hover:underline">Login with OTP</Link></p>
    </form>
  );
}

export function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) return setErr("Passwords don't match.");
    setBusy(true);
    const r = await post("/api/account/reset", { email: sp.get("e"), token: sp.get("t"), password: f.get("password") });
    setBusy(false);
    if (r.ok) { router.replace("/account"); router.refresh(); } else setErr(r.error || "Could not reset password.");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Password placeholder="New password (8+ characters)" autoComplete="new-password" />
      <Password name="confirm" placeholder="Confirm new password" autoComplete="new-password" />
      <Err msg={err} />
      <button disabled={busy} className={btn}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Save password</>}</button>
    </form>
  );
}
