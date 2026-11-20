"use client";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, btnDark, card, Field, ImagePick, input, Toggle } from "./ui";

type PageKey = "privacy" | "terms" | "refund" | "shipping";
export type S = {
  id: number; code: string; handle: string; name: string; tagline: string; about: string; logo_key: string | null; banner_key: string | null;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string; instagram?: string; facebook?: string };
  pages: Record<PageKey, { on: boolean; content: string }>;
  payments: { cod: boolean; upi: { on: boolean; vpa: string; qr_key: string | null }; razorpay: { on: boolean; key_id: string; hasSecret: boolean } };
  planName: string; limit: number | null; plan_expires_at: string | null; razorpayAllowed: boolean;
};
const TITLES: Record<PageKey, string> = { privacy: "Privacy Policy", terms: "Terms & Conditions", refund: "Refund & Exchange Policy", shipping: "Shipping Policy" };

export function SettingsPanel({ store, setStore, section }: { store: S; setStore: (s: S) => void; section: "profile" | "payments" | "pages" }) {
  const [s, setS] = useState(store);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const c = (k: keyof S["contact"], v: string) => setS({ ...s, contact: { ...s.contact, [k]: v } });

  async function save() {
    setBusy(true); setMsg(null);
    const body =
      section === "profile" ? { name: s.name, tagline: s.tagline, about: s.about, logo_key: s.logo_key, banner_key: s.banner_key, contact: s.contact }
      : section === "payments" ? { payments: { cod: s.payments.cod, upi: s.payments.upi, razorpay: { on: s.payments.razorpay.on, key_id: s.payments.razorpay.key_id, key_secret: secret } } }
      : { pages: s.pages };
    const r = await api<{ store: S }>("/api/store/settings", "PATCH", body);
    setBusy(false);
    if (r.ok) { setStore(r.data.store); setS(r.data.store); setSecret(""); setMsg({ ok: true, t: "Saved — your store is updated." }); } else setMsg({ ok: false, t: r.data.error || "Could not save." });
  }

  return (
    <div className="space-y-4">
      {section === "profile" && (
        <>
          <div className={cn(card, "space-y-5 p-5")}>
            <div className="grid grid-cols-[110px_1fr] gap-4">
              <ImagePick label="Logo" kind="logo" value={s.logo_key} onChange={(k) => setS({ ...s, logo_key: k })} />
              <ImagePick label="Home banner" kind="banner" aspect="aspect-[16/10]" value={s.banner_key} onChange={(k) => setS({ ...s, banner_key: k })} />
            </div>
            <Field label="Store name"><input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} className={input} /></Field>
            <Field label="Tagline" hint="One line under your name on the home page"><input value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} placeholder="Handcrafted ethnic wear, delivered across India" className={input} /></Field>
            <Field label="About your store" hint="Shown on your About page"><textarea value={s.about} onChange={(e) => setS({ ...s, about: e.target.value })} rows={6} className={cn(input, "resize-y")} /></Field>
          </div>
          <div className={cn(card, "grid gap-4 p-5 sm:grid-cols-2")}>
            <Field label="Phone"><input value={s.contact.phone ?? ""} onChange={(e) => c("phone", e.target.value)} inputMode="tel" className={input} /></Field>
            <Field label="WhatsApp number" hint="With country code, e.g. 919876543210"><input value={s.contact.whatsapp ?? ""} onChange={(e) => c("whatsapp", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={input} /></Field>
            <Field label="Email" hint="New-order alerts are sent here"><input value={s.contact.email ?? ""} onChange={(e) => c("email", e.target.value)} type="email" className={input} /></Field>
            <Field label="Instagram link"><input value={s.contact.instagram ?? ""} onChange={(e) => c("instagram", e.target.value)} placeholder="https://instagram.com/…" className={input} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><textarea value={s.contact.address ?? ""} onChange={(e) => c("address", e.target.value)} rows={2} className={cn(input, "resize-y")} /></Field></div>
          </div>
        </>
      )}

      {section === "payments" && (
        <>
          <div className={cn(card, "space-y-3 p-5")}>
            <Toggle on={s.payments.cod} onChange={(v) => setS({ ...s, payments: { ...s.payments, cod: v } })} label="Cash on delivery" sub="Customer pays when the order arrives" />
            <Toggle on={s.payments.upi.on} onChange={(v) => setS({ ...s, payments: { ...s.payments, upi: { ...s.payments.upi, on: v } } })} label="UPI (your own UPI ID / QR)" sub="Customer pays to you and enters the UTR — you verify it in Orders" />
            {s.payments.upi.on && (
              <div className="grid grid-cols-[1fr_120px] gap-4 rounded-2xl bg-foreground/[.03] p-4">
                <Field label="UPI ID"><input value={s.payments.upi.vpa} onChange={(e) => setS({ ...s, payments: { ...s.payments, upi: { ...s.payments.upi, vpa: e.target.value.trim() } } })} placeholder="yourname@okhdfcbank" className={input} /></Field>
                <ImagePick label="QR code" kind="qr" value={s.payments.upi.qr_key} onChange={(k) => setS({ ...s, payments: { ...s.payments, upi: { ...s.payments.upi, qr_key: k } } })} />
              </div>
            )}
          </div>
          <div className={cn(card, "space-y-3 p-5", !s.razorpayAllowed && "opacity-80")}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">Razorpay online checkout</p><p className="text-xs text-muted">Cards, UPI, netbanking straight to your Razorpay account.</p></div>
              {!s.razorpayAllowed && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-600"><Lock className="size-3" /> Starter+</span>}
            </div>
            {s.razorpayAllowed ? (
              <>
                <Toggle on={s.payments.razorpay.on} onChange={(v) => setS({ ...s, payments: { ...s.payments, razorpay: { ...s.payments.razorpay, on: v } } })} label="Accept online payments" />
                <Field label="Key ID"><input value={s.payments.razorpay.key_id} onChange={(e) => setS({ ...s, payments: { ...s.payments, razorpay: { ...s.payments.razorpay, key_id: e.target.value.trim() } } })} placeholder="rzp_live_…" className={input} /></Field>
                <Field label="Key secret" hint={s.payments.razorpay.hasSecret ? "Saved (hidden). Type to replace." : "Stored encrypted"}><input value={secret} onChange={(e) => setSecret(e.target.value)} type="password" autoComplete="off" className={input} /></Field>
              </>
            ) : (
              <p className="rounded-2xl bg-foreground/[.04] px-4 py-3 text-sm text-muted">Upgrade to the Starter plan or higher to connect your Razorpay account.</p>
            )}
          </div>
        </>
      )}

      {section === "pages" && (
        <div className="space-y-3">
          <p className="px-1 text-sm text-muted">Turn a page on and it appears in your store footer. Off = hidden.</p>
          {(Object.keys(TITLES) as PageKey[]).map((k) => (
            <div key={k} className={cn(card, "space-y-3 p-4")}>
              <Toggle on={s.pages[k].on} onChange={(v) => setS({ ...s, pages: { ...s.pages, [k]: { ...s.pages[k], on: v } } })} label={TITLES[k]} />
              {s.pages[k].on && <textarea value={s.pages[k].content} onChange={(e) => setS({ ...s, pages: { ...s.pages, [k]: { ...s.pages[k], content: e.target.value } } })} rows={7} placeholder={`Write your ${TITLES[k].toLowerCase()}…`} className={cn(input, "resize-y text-sm")} />}
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-20 z-20 sm:bottom-4">
        {msg && <p className={cn("mb-2 rounded-2xl px-4 py-2.5 text-sm font-medium", msg.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>{msg.t}</p>}
        <button onClick={save} disabled={busy} className={cn(btnDark, "w-full py-3.5 shadow-xl")}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Save"}</button>
      </div>
    </div>
  );
}
