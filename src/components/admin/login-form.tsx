"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Login failed");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }
  const input = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";
  return (
    <form onSubmit={submit} className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)]">
      <div className="relative mx-auto h-14 w-40">
        <Image src="/brand/vishnuit-vishnu-logo-white.png" alt="Vishnu IT" fill sizes="160px" className="object-contain dark:hidden" />
        <Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT" fill sizes="160px" className="hidden object-contain dark:block" />
      </div>
      <h1 className="mt-6 text-center font-display text-xl font-bold">Admin dashboard</h1>
      <p className="mt-1 mb-7 text-center text-sm text-muted">Sign in to manage your website</p>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Email</span>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="mb-2 block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Password</span>
        <div className="relative">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className={input} />
          <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-label="Toggle password">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
      <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-60">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Sign in</>}
      </button>
    </form>
  );
}
