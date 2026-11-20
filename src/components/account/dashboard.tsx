"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Camera, CheckCircle2, Clock, FileText, LayoutDashboard, Loader2, LogOut, Receipt, Store, UserCog, XCircle } from "lucide-react";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import { field } from "./auth-forms";

export type AccountPayment = {
  plan_id: number | null; plan_name: string; amount: number; status: string; method: string | null;
  rzp_order_id: string; rzp_payment_id: string | null; created_at: string; paid_at: string | null;
};
type U = { uid: string; name: string; email: string | null; phone: string | null; company: string | null; avatar: string | null; hasPassword: boolean };
type Tab = "overview" | "orders" | "payments" | "profile";
export type MyOrder = { order_no: string; store: string; handle: string; subtotal: number; status: string; pay_method: string; pay_status: string; created_at: string; items: { name: string; variant: string | null; qty: number }[]; invoice: string };

const d = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function AccountDashboard({ user: initial, memberSince, payments, initialTab, showStoreCard, showStoreTab, store, orders }: { user: U; memberSince: string; payments: AccountPayment[]; initialTab: Tab; showStoreCard: boolean; showStoreTab: boolean; store: { name: string; handle: string } | null; orders: MyOrder[] }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [user, setUser] = useState(initial);
  const paid = payments.filter((p) => p.status === "paid");
  const total = paid.reduce((n, p) => n + p.amount, 0);
  const tabs: [Tab, string, typeof LayoutDashboard][] = [["overview", "Overview", LayoutDashboard], ...(orders.length ? [["orders", `My Orders (${orders.length})`, ShoppingBag] as [Tab, string, typeof LayoutDashboard]] : []), ["payments", "Payments", Receipt], ["profile", "Profile", UserCog]];

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <section className="px-4 pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="flex items-center gap-4">
          <Avatar user={user} size="size-16" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight md:text-3xl">{user.name ? `Hi, ${user.name.split(" ")[0]}` : "My account"}</h1>
            <p className="truncate text-sm text-muted">ID <span className="font-mono font-semibold text-foreground">{user.uid}</span> · Member since {d(memberSince)}</p>
          </div>
          <button onClick={logout} className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:text-red-500 sm:inline-flex"><LogOut className="size-4" /> Log out</button>
        </div>

        {/* tabs — scrollable pills on phones */}
        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition", tab === k ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
          {showStoreTab && <Link href={store ? "/seller" : "/account/store"} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d4a017]/50 bg-[#d4a017]/10 px-4 py-2.5 text-sm font-semibold text-[#8a6a0c] dark:text-[#f5c542]">
            <Store className="size-4" /> {store ? "My Store" : "Create Store"} <ArrowRight className="size-3.5" />
          </Link>}
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Total paid" value={formatINR(total)} />
              <Stat label="Payments" value={String(paid.length)} />
              <Stat label="Invoices" value={String(paid.length)} />
              {showStoreCard && <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1f] p-6 text-white md:col-span-3 md:p-8">
                <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.45),transparent)]" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f5c542]/15 px-3 py-1 text-xs font-bold tracking-widest text-[#f5c542]"><Store className="size-3.5" /> {store ? "YOUR STORE" : "NEW"}</span>
                    <h2 className="mt-3 font-display text-2xl font-extrabold">{store ? store.name : "Launch your own online store"}</h2>
                    <p className="mt-1.5 max-w-lg text-sm text-white/70">{store ? `vishnuit.co.in/catalog/@${store.handle}` : "List your products, get your own store link at vishnuit.co.in/catalog/@yourname and take orders on WhatsApp, UPI or COD — free for up to 15 products."}</p>
                  </div>
                  <a href={store ? "/seller" : "/account/store"} className="shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-black">{store ? "Manage store" : "Create my store"}</a>
                </div>
              </div>}
              {paid[0] && (
                <div className="rounded-3xl border border-border bg-card p-5 md:col-span-3">
                  <p className="text-xs font-bold tracking-widest text-muted">LATEST PAYMENT</p>
                  <PaymentRow p={paid[0]} />
                </div>
              )}
            </div>
          )}

          {tab === "orders" && (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.order_no} className="rounded-3xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><a href={`/catalog/@${o.handle}`} className="truncate font-semibold hover:underline">{o.store}</a><p className="text-xs text-muted">#{o.order_no} · {d(o.created_at)}</p></div>
                    <p className="shrink-0 font-display font-bold">{formatINR(o.subtotal)}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.qty}`).join(", ")}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold capitalize">{o.status === "new" ? "Order placed" : o.status}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", o.pay_status === "paid" || o.pay_status === "verified" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>{o.pay_method === "cod" ? "Cash on delivery" : o.pay_status === "paid" || o.pay_status === "verified" ? "Paid" : "Payment pending"}</span>
                    </div>
                    <a href={o.invoice} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background"><FileText className="size-3.5" /> Invoice</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "payments" && (
            <div className="rounded-3xl border border-border bg-card p-2 sm:p-4">
              {payments.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted">No payments yet. When you pay us, your invoices appear here.</p>
              ) : (
                payments.map((p) => <PaymentRow key={p.rzp_order_id} p={p} />)
              )}
            </div>
          )}

          {tab === "profile" && <Profile user={user} onChange={setUser} />}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function PaymentRow({ p }: { p: AccountPayment }) {
  const S = p.status === "paid" ? { I: CheckCircle2, c: "text-emerald-600 bg-emerald-500/10", t: "Paid" } : p.status === "failed" ? { I: XCircle, c: "text-red-500 bg-red-500/10", t: "Failed" } : { I: Clock, c: "text-amber-600 bg-amber-500/10", t: "Pending" };
  return (
    <div className="border-b border-border px-3 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-semibold">{p.plan_id ? `${p.plan_name} plan` : p.plan_name}</p>
        <p className="shrink-0 font-display font-bold">{formatINR(p.amount)}</p>
      </div>
      <p className="mt-0.5 text-xs break-all text-muted">{d(p.paid_at ?? p.created_at)}{p.rzp_payment_id ? <> · <span className="font-mono">{p.rzp_payment_id}</span></> : null}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", S.c)}><S.I className="size-3.5" />{S.t}</span>
        {p.status === "paid" && (
          <a href={`/api/account/invoice/${encodeURIComponent(p.rzp_order_id)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background">
            <FileText className="size-3.5" /> Download invoice
          </a>
        )}
      </div>
    </div>
  );
}

function Avatar({ user, size }: { user: U; size: string }) {
  const initials = (user.name || user.email || "U").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-white font-bold", size)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}

function Profile({ user, onChange }: { user: U; onChange: (u: U) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState<"" | "photo" | "info" | "pw">("");

  async function upload(f: File) {
    setBusy("photo"); setMsg(null);
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/account/avatar", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    if (r.ok) { onChange({ ...user, avatar: j.avatar }); setMsg({ ok: true, t: "Photo updated." }); router.refresh(); } else setMsg({ ok: false, t: j.error || "Upload failed." });
  }
  async function saveInfo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("info"); setMsg(null);
    const r = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    if (r.ok) { onChange({ ...user, ...j.user }); setMsg({ ok: true, t: "Saved." }); } else setMsg({ ok: false, t: j.error || "Could not save." });
  }
  async function savePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("pw"); setPwMsg(null);
    const f = e.currentTarget;
    const r = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    if (r.ok) { f.reset(); onChange({ ...user, hasPassword: true }); setPwMsg({ ok: true, t: "Password saved. Other devices were signed out." }); } else setPwMsg({ ok: false, t: j.error || "Could not save password." });
  }
  const Note = ({ m }: { m: { ok: boolean; t: string } | null }) => (m ? <p className={cn("text-sm font-medium", m.ok ? "text-emerald-600" : "text-red-500")}>{m.t}</p> : null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={saveInfo} className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="size-20" />
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === "photo"} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold">
              {busy === "photo" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Change photo
            </button>
            <p className="mt-1.5 text-xs text-muted">JPG, PNG or WebP · up to 3 MB</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
        </div>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Full name</span><input name="name" defaultValue={user.name} required className={field} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Email</span><input name="email" type="email" defaultValue={user.email ?? ""} className={field} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Mobile (login with OTP)</span><input value={user.phone ?? "—"} disabled className={cn(field, "opacity-60")} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Company / GSTIN (optional)</span><input name="company" defaultValue={user.company ?? ""} className={field} /></label>
        <Note m={msg} />
        <button disabled={busy === "info"} className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background disabled:opacity-60">{busy === "info" ? "Saving…" : "Save details"}</button>
      </form>

      <form onSubmit={savePw} className="h-fit space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold">{user.hasPassword ? "Change password" : "Set a password"}</h3>
        {!user.hasPassword && <p className="text-sm text-muted">You signed in with OTP or paid as a guest. Set a password to also log in with your email.</p>}
        {user.hasPassword && <input name="current" type="password" required placeholder="Current password" autoComplete="current-password" className={field} />}
        <input name="password" type="password" required minLength={8} placeholder="New password (8+ characters)" autoComplete="new-password" className={field} />
        <Note m={pwMsg} />
        <button disabled={busy === "pw"} className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background disabled:opacity-60">{busy === "pw" ? "Saving…" : "Save password"}</button>
      </form>
    </div>
  );
}
