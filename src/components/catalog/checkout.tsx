"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rupee, useCart } from "./cart";

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-[15px] outline-none transition focus:border-foreground/50";

/** Cart + checkout on one page (built for phones). */
export function Checkout({ handle, base, storeName, pay }: { handle: string; base: string; storeName: string; pay: { cod: boolean; upi: boolean; vpa: string; qr: string | null } }) {
  const { lines, total, setQty, remove, clear, ready } = useCart();
  const [method, setMethod] = useState<"cod" | "upi">(pay.cod ? "cod" : "upi");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ orderNo: string; subtotal: number } | null>(null);

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch(`/api/catalog/@${handle}/order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, pay_method: method, items: lines.map((l) => ({ id: l.id, variant: l.variant ?? undefined, qty: l.qty })) }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setDone({ orderNo: j.orderNo, subtotal: j.subtotal }); clear(); window.scrollTo({ top: 0 }); } else setErr(j.error || "Could not place the order.");
  }

  if (done)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-10" /></div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">Order placed!</h1>
        <p className="mt-2 text-muted">Order <b className="text-foreground">#{done.orderNo}</b> · {rupee(done.subtotal)}</p>
        <p className="mt-4 text-sm text-muted">{storeName} will confirm your order shortly{method === "upi" ? " after checking your UPI payment" : ""}. Keep your phone handy.</p>
        <Link href={base} className="mt-8 inline-block rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background">Continue shopping</Link>
      </div>
    );

  if (!ready) return <div className="h-[50vh]" />;
  if (!lines.length)
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Your cart is empty</h1>
        <Link href={`${base}/shop`} className="mt-7 inline-block rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background">Start shopping</Link>
      </div>
    );

  const upiLink = pay.vpa ? `upi://pay?pa=${encodeURIComponent(pay.vpa)}&pn=${encodeURIComponent(storeName)}&am=${total.toFixed(2)}&cu=INR` : null;
  return (
    <form onSubmit={place} className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your cart</h1>
        <div className="mt-6 divide-y divide-border rounded-[1.6rem] border border-border">
          {lines.map((l, i) => (
            <div key={`${l.id}-${l.variant}`} className="flex gap-4 p-4">
              <Link href={`${base}/p/${l.slug}`} className="size-20 shrink-0 overflow-hidden rounded-2xl bg-foreground/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image && <img src={l.image} alt="" className="size-full object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-semibold">{l.name}</p>
                {l.variant && <p className="text-xs text-muted">{l.variant}</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-border">
                    <button type="button" onClick={() => setQty(i, l.qty - 1)} aria-label="Less" className="grid size-9 place-items-center"><Minus className="size-3.5" /></button>
                    <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                    <button type="button" onClick={() => setQty(i, l.qty + 1)} aria-label="More" className="grid size-9 place-items-center"><Plus className="size-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-2"><b>{rupee(l.price * l.qty)}</b><button type="button" onClick={() => remove(i)} aria-label="Remove" className="grid size-9 place-items-center rounded-full text-muted hover:text-red-500"><Trash2 className="size-4" /></button></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[1.6rem] border border-border p-5">
          <p className="font-display text-lg font-bold">Delivery details</p>
          <div className="mt-4 space-y-3">
            <input name="name" required placeholder="Full name" autoComplete="name" className={field} />
            <input name="phone" required inputMode="tel" maxLength={13} placeholder="Mobile number" autoComplete="tel" className={field} />
            <input name="email" type="email" placeholder="Email (optional)" autoComplete="email" className={field} />
            <textarea name="address" required rows={3} placeholder="House no, street, area, city, PIN code" autoComplete="street-address" className={cn(field, "resize-none")} />
          </div>
        </div>
        <div className="rounded-[1.6rem] border border-border p-5">
          <p className="font-display text-lg font-bold">Payment</p>
          <div className="mt-4 grid gap-2.5">
            {pay.cod && <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5", method === "cod" ? "border-foreground" : "border-border")}><input type="radio" checked={method === "cod"} onChange={() => setMethod("cod")} className="accent-black" /><span className="font-semibold">Cash on delivery</span></label>}
            {pay.upi && <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5", method === "upi" ? "border-foreground" : "border-border")}><input type="radio" checked={method === "upi"} onChange={() => setMethod("upi")} className="accent-black" /><span className="font-semibold">Pay by UPI</span></label>}
          </div>
          {method === "upi" && (
            <div className="mt-4 space-y-3 rounded-2xl bg-foreground/[.03] p-4 text-sm">
              <p>Pay <b>{rupee(total)}</b> to {pay.vpa ? <b className="break-all">{pay.vpa}</b> : "the QR below"}, then enter the UTR / transaction ID.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {pay.qr && <img src={pay.qr} alt="UPI QR" className="mx-auto w-48 rounded-xl bg-white p-2" />}
              {upiLink && <a href={upiLink} className="block rounded-full bg-foreground py-3 text-center text-sm font-bold text-background sm:hidden">Open UPI app</a>}
              <input name="utr" required placeholder="UTR / UPI transaction ID" inputMode="numeric" className={field} />
            </div>
          )}
        </div>
        <div className="rounded-[1.6rem] bg-foreground/[.03] p-5">
          <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>{rupee(total)}</span></div>
          <div className="mt-2 flex justify-between font-display text-lg font-bold"><span>Total</span><span>{rupee(total)}</span></div>
          {err && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
          <button disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-bold text-background disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : `Place order · ${rupee(total)}`}</button>
        </div>
      </div>
    </form>
  );
}
