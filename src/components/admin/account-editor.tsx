"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Settings2, X } from "lucide-react";
import { inputCls } from "@/components/admin/fields";
import { adminDate, adminINR } from "@/components/admin/fmt";
import { DomainManager } from "@/components/seller/domain";

export type Account = {
  id: number; uid: string; name: string; email: string | null; phone: string | null; status: string; source: string;
  google: boolean; hasPassword: boolean; created_at: string; last_login: string | null;
};
type PlanPay = { count: number; total: number; last: string | null };
type StoreVol = { orders: number; delivered: number; paid: number; cancelled: number; gmv: number; firstOrder: string | null; lastOrder: string | null; planPayments: PlanPay };
type StoreDetail = { store: { id: number; code: string; handle: string; name: string; plan: string; plan_expires_at: string | null; status: string; domain: string | null; created_at: string }; owner: Account | null; volume: StoreVol };
type UserDetail = {
  user: Account;
  volume: {
    stores: { id: number; name: string; handle: string; code: string; plan: string; plan_expires_at: string | null; status: string; orders: number; gmv: number }[];
    customer: { orders: number; spend: number; lastOrder: string | null };
    servicePayments: { count: number; total: number };
    planPayments: PlanPay;
  };
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

export function GoogleBadge({ email }: { email?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600" title={email ? `Google login · ${email}` : "Google login"}>
      <svg viewBox="0 0 24 24" className="size-3" aria-hidden><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22ZM6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9Z" /></svg>
      Google login
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

function Drawer({ title, sub, onClose, children }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-card p-6 text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="truncate font-display text-xl font-bold">{title}</h2>{sub && <div className="text-sm text-muted">{sub}</div>}</div>
          <button onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-medium text-muted">{children}</span>;
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-6"><p className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">{title}</p>{children}</section>
);

/** Edit an account's name / email / phone and manage its Google link. Used for store owners and on the Users page. */
export function AccountEditor({ account, onChange }: { account: Account; onChange: (a: Account) => void }) {
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const [busy, setBusy] = useState<"" | "save" | "google">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { setName(account.name); setEmail(account.email ?? ""); setPhone(account.phone ?? ""); }, [account]);

  const dirty = name !== account.name || email !== (account.email ?? "") || phone !== (account.phone ?? "");
  async function save() {
    setBusy("save"); setMsg(null);
    const body: Record<string, string> = {};
    if (name !== account.name) body.name = name;
    if (email !== (account.email ?? "")) body.email = email;
    if (phone !== (account.phone ?? "")) body.phone = phone;
    try {
      const j = await api<{ user: Account }>(`/api/admin/users/${account.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onChange(j.user); setMsg({ ok: true, text: "Saved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy("");
  }
  async function unlinkGoogle() {
    const ok = window.confirm(
      `Reset the Google link for ${account.name || account.uid}?\n\n` +
      "• The account will no longer be tied to their Google account and becomes a normal email/phone login.\n" +
      "• They log in with an email/phone OTP, or set a password via “Forgot password”.\n" +
      `• ${account.hasPassword ? "Their existing password keeps working." : "They have no password yet."}\n` +
      "• If they click “Continue with Google” again with the same email, it will link again automatically.\n\n" +
      "Their data, store and orders are not touched.",
    );
    if (!ok) return;
    setBusy("google"); setMsg(null);
    try {
      const j = await api<{ user: Account }>(`/api/admin/users/${account.id}`, { method: "PATCH", body: JSON.stringify({ resetGoogle: true }) });
      onChange(j.user); setMsg({ ok: true, text: "Google link removed — the account is now a normal email login." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-muted">#{account.id} · {account.uid}</span>
        {account.google ? <GoogleBadge email={account.email} /> : <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold text-muted">Email / phone login</span>}
        {!account.hasPassword && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">No password</span>}
        {account.status !== "active" && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500 uppercase">{account.status}</span>}
      </div>
      {account.google && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs">
          <p><span className="font-semibold">Signs in with Google</span>{account.email ? <> · <span className="font-mono">{account.email}</span></> : null}</p>
          <p className="mt-1 text-muted">The email stays the Google email while Google login is linked. Reset the Google link to make this a normal email login — then the email can be changed.</p>
          <button onClick={unlinkGoogle} disabled={!!busy} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-semibold hover:border-red-400 hover:text-red-500 disabled:opacity-50">
            {busy === "google" && <Loader2 className="size-3 animate-spin" />} Reset Google link
          </button>
        </div>
      )}
      <label className="block"><Label>Name</Label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><Label>Email{account.google && <span className="ml-1 normal-case text-blue-600">· locked (Google)</span>}</Label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={account.google} title={account.google ? "Reset the Google link to change this email" : undefined} placeholder="name@example.com" className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`} /></label>
        <label className="block"><Label>Phone</Label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" className={inputCls} /></label>
      </div>
      {msg && <p className={`rounded-xl px-3 py-2 text-xs font-medium ${msg.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"}`}>{msg.text}</p>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!dirty || !!busy} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy === "save" && <Loader2 className="size-3.5 animate-spin" />} Save account
        </button>
        <p className="text-[11px] text-muted">Joined {adminDate(account.created_at)} · last login {adminDate(account.last_login)}</p>
      </div>
    </div>
  );
}

function useDetail<T>(url: string, open: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { setErr(""); api<T>(url).then(setData, (e: Error) => setErr(e.message)); }, [url]);
  useEffect(() => { if (open) load(); }, [open, load]);
  return { data, setData, err, load };
}

const ManageBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"><Settings2 className="size-3" /> Manage</button>
);

/** Catalog Stores row → drawer: rename / change handle, owner account (email, phone, Google link) and transaction volume. */
export function StoreManage({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data, setData, err, load } = useDetail<StoreDetail>(`/api/admin/stores/${id}`, open);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (data) { setName(data.store.name); setHandle(data.store.handle); } }, [data]);
  const close = useCallback(() => { setOpen(false); setMsg(null); router.refresh(); }, [router]);

  async function saveStore() {
    if (!data) return;
    setBusy(true); setMsg(null);
    try {
      await api(`/api/admin/stores/${id}`, { method: "PATCH", body: JSON.stringify({ name, handle }) });
      setMsg({ ok: true, text: "Store saved." }); load();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false);
  }

  if (!open) return <ManageBtn onClick={() => setOpen(true)} />;
  const s = data?.store;
  const v = data?.volume;
  const dirty = !!s && (name !== s.name || handle.replace(/^@/, "").toLowerCase() !== s.handle);
  return (
    <Drawer title={s?.name ?? "Store"} sub={s ? <>@{s.handle} · <span className="font-mono">{s.code}</span></> : null} onClose={close}>
      {err && <p className="mt-5 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</p>}
      {!data && !err && <p className="mt-8 flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Loading…</p>}
      {s && v && (
        <>
          <Section title="Store">
            <div className="space-y-3">
              <label className="block"><Label>Store name</Label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></label>
              <label className="block"><Label>Store link (handle)</Label>
                <div className="flex items-center rounded-xl border border-border bg-background pl-3.5 text-sm focus-within:border-accent"><span className="text-muted">/catalog/@</span><input value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full bg-transparent py-2.5 pr-3.5 outline-none" /></div>
                <span className="mt-1 block text-[11px] text-muted">3–30 letters, numbers, - or _. Old links to @{s.handle} stop working after a change.</span>
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><Label>Store code (fixed — used for storage)</Label><p className="font-mono">{s.code}</p></div>
                <div><Label>Plan</Label><p className="capitalize">{s.plan}{s.plan_expires_at ? ` · valid till ${adminDate(s.plan_expires_at)}` : ""}</p></div>
                <div><Label>Opened</Label><p>{adminDate(s.created_at)}</p></div>
              </div>
              {msg && <p className={`rounded-xl px-3 py-2 text-xs font-medium ${msg.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"}`}>{msg.text}</p>}
              <div className="flex items-center gap-3">
                <button onClick={saveStore} disabled={!dirty || busy} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="size-3.5 animate-spin" />} Save store</button>
                <a href={`/catalog/@${s.handle}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-semibold text-accent">Open store <ExternalLink className="size-3" /></a>
              </div>
            </div>
          </Section>
          <Section title="Custom domain">
            <p className="mb-3 text-xs text-muted">Connect a domain for this seller (any plan). It shows on their Seller → Domain page too, with the DNS steps.</p>
            <DomainManager key={s.domain ?? "none"} handle={s.handle} initial={s.domain} paid endpoint={`/api/admin/stores/${s.id}/domain`} compact />
          </Section>
          <Section title="Transaction volume">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Total orders" value={v.orders} sub={v.cancelled ? `${v.cancelled} cancelled` : undefined} />
              <Stat label="Delivered" value={v.delivered} />
              <Stat label="Paid" value={v.paid} sub="paid / verified" />
              <Stat label="GMV" value={adminINR(v.gmv)} sub="excl. cancelled" />
              <Stat label="Last order" value={<span className="text-base">{adminDate(v.lastOrder)}</span>} sub={v.firstOrder ? `first ${adminDate(v.firstOrder)}` : undefined} />
              <Stat label="Plan payments" value={adminINR(v.planPayments.total)} sub={`${v.planPayments.count} paid${v.planPayments.last ? ` · last ${adminDate(v.planPayments.last)}` : ""}`} />
            </div>
          </Section>
          <Section title="Owner account">
            {data.owner ? <AccountEditor account={data.owner} onChange={(owner) => setData({ ...data, owner })} /> : <p className="text-sm text-muted">Owner account not found.</p>}
          </Section>
        </>
      )}
    </Drawer>
  );
}

/** Users row → drawer: edit account, Google link, and what they did with us. */
export function UserManage({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data, setData, err } = useDetail<UserDetail>(`/api/admin/users/${id}`, open);
  const close = useCallback(() => { setOpen(false); router.refresh(); }, [router]);
  if (!open) return <ManageBtn onClick={() => setOpen(true)} />;
  const v = data?.volume;
  return (
    <Drawer title={data?.user.name || data?.user.uid || "User"} sub={data ? <span className="font-mono">{data.user.uid}</span> : null} onClose={close}>
      {err && <p className="mt-5 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</p>}
      {!data && !err && <p className="mt-8 flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Loading…</p>}
      {data && v && (
        <>
          <Section title="Account"><AccountEditor account={data.user} onChange={(user) => setData({ ...data, user })} /></Section>
          <Section title="Volume">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Stores owned" value={v.stores.length} />
              <Stat label="Orders placed" value={v.customer.orders} sub={v.customer.lastOrder ? `last ${adminDate(v.customer.lastOrder)}` : "as a shopper"} />
              <Stat label="Shopper spend" value={adminINR(v.customer.spend)} sub="excl. cancelled" />
              <Stat label="Plan payments" value={adminINR(v.planPayments.total)} sub={`${v.planPayments.count} paid${v.planPayments.last ? ` · last ${adminDate(v.planPayments.last)}` : ""}`} />
              <Stat label="Service payments" value={adminINR(v.servicePayments.total)} sub={`${v.servicePayments.count} paid`} />
            </div>
            {v.stores.length > 0 && (
              <div className="mt-3 divide-y divide-border rounded-xl border border-border">
                {v.stores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                    <div className="min-w-0"><p className="truncate font-semibold">{s.name}</p><p className="text-muted">@{s.handle} · {s.code} · <span className="capitalize">{s.plan}</span>{s.plan_expires_at ? ` till ${adminDate(s.plan_expires_at)}` : ""}</p></div>
                    <div className="shrink-0 text-right"><p className="font-semibold">{adminINR(s.gmv)}</p><p className="text-muted">{s.orders} orders</p></div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </Drawer>
  );
}
