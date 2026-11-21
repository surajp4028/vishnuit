"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Camera, CheckCircle2, Clock, FileText, LayoutDashboard, Loader2, LogOut, Receipt, Store, UserCog, XCircle } from "lucide-react";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import { field } from "./auth-forms";
import { EmailChange, PhoneVerify } from "./phone-verify";
import { ORDER_COLOR, ORDER_FLOW, ORDER_LABEL, PAY_COLOR, PAY_LABEL } from "@/lib/order-status";

export type AccountPayment = {
  plan_id: number | null; plan_name: string; amount: number; status: string; method: string | null;
  rzp_order_id: string; rzp_payment_id: string | null; created_at: string; paid_at: string | null;
};
type U = { uid: string; name: string; email: string | null; phone: string | null; company: string | null; avatar: string | null; hasPassword: boolean; google?: boolean };
type Tab = "overview" | "orders" | "payments" | "profile";
export type MyOrder = { order_no: string; store: string; handle: string; subtotal: number; status: string; pay_method: string; pay_status: string; created_at: string; items: { name: string; variant: string | null; qty: number }[]; invoice: string; status_log?: { s: string; at: string }[]; tracking?: { courier: string; number: string; url: string } | null };

const d = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function AccountDashboard({ user: initial, memberSince, payments, initialTab, showStoreCard, showStoreTab, store, orders }: { user: U; memberSince: string; payments: AccountPayment[]; initialTab: Tab; showStoreCard: boolean; showStoreTab: boolean; store: { name: string; handle: string; domain?: string | null } | null; orders: MyOrder[] }) {
  const sellerHref = store?.domain ? "/api/account/jump?to=store&next=/seller" : "/seller";
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
          {showStoreTab && <Link href={store ? sellerHref : "/account/store"} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d4a017]/50 bg-[#d4a017]/10 px-4 py-2.5 text-sm font-semibold text-[#8a6a0c] dark:text-[#f5c542]">
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
                    {store ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                        {store.domain && <a href={`https://${store.domain}`} target="_blank" rel="noopener" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20"><span className="text-emerald-300">🔒</span><span className="truncate">{store.domain}</span><span className="rounded-full bg-emerald-400/20 px-1.5 text-[10px] font-bold text-emerald-200">your domain</span></a>}
                        <a href={`/catalog/@${store.handle}`} target="_blank" rel="noopener" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-semibold hover:bg-white/15"><span className="truncate">vishnuit.co.in/catalog/@{store.handle}</span></a>
                        {!store.domain && <a href="/seller/domain" className="inline-flex items-center rounded-full px-2 py-1.5 font-semibold text-[#f5c542] hover:underline">+ Connect your domain</a>}
                      </div>
                    ) : <p className="mt-1.5 max-w-lg text-sm text-white/70">List your products, get your own store link at vishnuit.co.in/catalog/@yourname and take orders on WhatsApp, UPI or COD — free for up to 15 products.</p>}
                  </div>
                  <a href={store ? sellerHref : "/account/store"} className="shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-black">{store ? (store.domain ? `Manage on ${store.domain}` : "Manage store") : "Create my store"}</a>
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
                  {!["cancelled", "returned"].includes(o.status) && (() => {
                    const cur = ORDER_FLOW.indexOf(o.status as (typeof ORDER_FLOW)[number]);
                    const steps = ["new", "confirmed", "shipped", "delivered"] as const;
                    const at = (s: string) => [...(o.status_log ?? [])].reverse().find((l) => l.s === s)?.at ?? (s === "new" ? o.created_at : undefined);
                    return (
                      <ol className="mt-4 grid grid-cols-4">
                        {steps.map((s, k) => {
                          const done = ORDER_FLOW.indexOf(s) <= cur;
                          const t = at(s);
                          return (
                            <li key={s} className="relative flex flex-col items-center text-center">
                              {k > 0 && <span className={cn("absolute top-[9px] right-1/2 h-0.5 w-full", done ? "bg-emerald-500" : "bg-border")} />}
                              <span className={cn("relative z-10 size-5 rounded-full border-[3px]", done ? "border-emerald-500 bg-emerald-500" : "border-border bg-card")} />
                              <span className={cn("mt-1.5 text-[11px] font-semibold", !done && "text-muted")}>{ORDER_LABEL[s]}</span>
                              {done && t && <span className="text-[10px] text-muted">{new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                            </li>
                          );
                        })}
                      </ol>
                    );
                  })()}
                  {o.tracking?.number && (
                    <p className="mt-3 rounded-2xl bg-foreground/[.03] px-4 py-2.5 text-xs">Shipped via <b>{o.tracking.courier || "courier"}</b> · AWB <span className="font-mono font-semibold">{o.tracking.number}</span>{o.tracking.url && <> · <a href={o.tracking.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Track package</a></>}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ORDER_COLOR[o.status] ?? "bg-foreground/5")}>{ORDER_LABEL[o.status] ?? o.status}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PAY_COLOR[o.pay_status] ?? "bg-foreground/5")}>{o.pay_method === "cod" && o.pay_status === "pending" ? "Cash on delivery" : PAY_LABEL[o.pay_status] ?? o.pay_status}</span>
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
  const [editPhone, setEditPhone] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
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
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Email</span>
          {editEmail ? (
            <EmailChange onDone={(e) => { onChange({ ...user, email: e }); setEditEmail(false); }} onCancel={() => setEditEmail(false)} />
          ) : (
            <div className="flex items-center gap-2">
              <input value={user.email ?? "—"} disabled className={cn(field, "opacity-70")} />
              {user.google ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted" title="Signed in with Google — the email comes from your Google account"><svg viewBox="0 0 48 48" className="size-3.5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Linked with Google</span>
              ) : (
                <button type="button" onClick={() => setEditEmail(true)} className="shrink-0 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:border-accent">{user.email ? "Change" : "Add"}</button>
              )}
            </div>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Mobile (login with OTP)</span>
          {user.phone && !editPhone ? (
            <div className="flex items-center gap-2">
              <input value={user.phone} disabled className={cn(field, "opacity-70")} />
              <button type="button" onClick={() => setEditPhone(true)} className="shrink-0 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:border-accent">Change</button>
            </div>
          ) : (
            <PhoneVerify
              title={user.phone ? "Change your mobile number" : "Add your mobile number"}
              hint="Used for OTP login, order updates and your store's WhatsApp. We'll send a code by SMS."
              onDone={(p) => { onChange({ ...user, phone: p }); setEditPhone(false); }}
            />
          )}
        </div>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Company / GSTIN (optional)</span><input name="company" defaultValue={user.company ?? ""} className={field} /></label>
        <Note m={msg} />
        <button disabled={busy === "info"} className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background disabled:opacity-60">{busy === "info" ? "Saving…" : "Save details"}</button>
      </form>

      <form onSubmit={savePw} className="h-fit space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold">{user.hasPassword ? "Change password" : "Set a password"}</h3>
        {!user.hasPassword && <p className="text-sm text-muted">{user.google ? "You sign in with Google. Optionally set a password to also log in with your email." : "You signed in with OTP or paid as a guest. Set a password to also log in with your email."}</p>}
        {user.hasPassword && <input name="current" type="password" required placeholder="Current password" autoComplete="current-password" className={field} />}
        <input name="password" type="password" required minLength={8} placeholder="New password (8+ characters)" autoComplete="new-password" className={field} />
        <Note m={pwMsg} />
        <button disabled={busy === "pw"} className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background disabled:opacity-60">{busy === "pw" ? "Saving…" : "Save password"}</button>
      </form>

      <DeleteAccount />
    </div>
  );
}

/** Right to erasure (DPDP Act 2023): typed confirmation, then the account is anonymised. Invoices are kept by law. */
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (text !== "DELETE") return;
    setBusy(true); setErr("");
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: text }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { window.location.href = "/?account=deleted"; return; }
    setBusy(false); setErr(j.error || "Could not delete your account.");
  }
  return (
    <div className="rounded-3xl border border-red-500/25 bg-card p-5 sm:p-6 md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Delete my account</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">Removes your name, email, mobile, photo and logins, and signs you out everywhere. Invoices and payment records are kept as the law requires, without your contact details. Open orders must be delivered or cancelled first. This can&apos;t be undone.</p>
        </div>
        {!open && <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-full border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/5">Delete account</button>}
      </div>
      {open && (
        <form onSubmit={go} className="mt-4 space-y-3">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Type <b className="font-mono text-foreground">DELETE</b> to confirm</span><input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} className={field} /></label>
          {err && <p className="text-sm font-medium text-red-500">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || text !== "DELETE"} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Deleting…" : "Permanently delete my account"}</button>
            <button type="button" onClick={() => { setOpen(false); setText(""); setErr(""); }} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
