"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, CreditCard, Loader2, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rupee, useCart } from "./cart";
import { loadRazorpay } from "@/components/site/plan-checkout";
import { GST_STATES } from "@/lib/gst-states";
import { PhoneVerify } from "@/components/account/phone-verify";

const field = "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-foreground/60 focus:ring-4 focus:ring-foreground/5";
const box = "rounded-2xl border border-border bg-card p-4 sm:p-5";
const step = (n: number, t: string) => <p className="flex items-center gap-2.5 font-display text-[15px] font-bold"><span className="grid size-6 place-items-center rounded-full bg-foreground text-[11px] text-background">{n}</span>{t}</p>;

/** Cart + checkout on one page (built for phones). */
type Rules = { cod: number; upi: number; razorpay: number; freeAbove: number; minOrder: number; closed: string; gstRate: number; gstOn: boolean; inclusive: boolean };
export function Checkout({ handle, base, storeName, pay, rules }: { handle: string; base: string; storeName: string; pay: { cod: boolean; upi: boolean; vpa: string; qr: string | null; razorpay: boolean }; rules: Rules }) {
  const { lines, total, setQty, remove, clear, ready } = useCart();
  const [method, setMethod] = useState<"cod" | "upi" | "razorpay">(pay.razorpay ? "razorpay" : pay.cod ? "cod" : "upi");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ orderNo: string; subtotal: number } | null>(null);
  const [me, setMe] = useState<{ name: string; phone: string | null; email: string | null } | null | undefined>(undefined);
  useEffect(() => { fetch("/api/account/me").then((r) => r.json()).then((j) => setMe(j?.user ?? null)).catch(() => setMe(null)); }, []);

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch(`/api/catalog/@${handle}/order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, pay_method: method, items: lines.map((l) => ({ id: l.id, variant: l.variant ?? undefined, qty: l.qty })) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(false); return setErr(j.error || "Could not place the order."); }
    if (j.rzp) {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setBusy(false); return setErr("Could not open the payment window. Your order is saved — the store will contact you."); }
      const rp = new window.Razorpay({
        key: j.rzp.keyId, order_id: j.rzp.orderId, amount: j.rzp.amount, currency: j.rzp.currency, name: storeName,
        description: `Order #${j.orderNo}`, prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: "#0a0f1f" },
        handler: async (res: Record<string, string>) => {
          await fetch(`/api/catalog/@${handle}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(res) });
          setBusy(false); setDone({ orderNo: j.orderNo, subtotal: j.subtotal }); clear(); window.scrollTo({ top: 0 });
        },
        modal: { ondismiss: () => {
          // Not paid: cancel that attempt so its stock is released, and let them try again.
          fetch(`/api/catalog/@${handle}/verify`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: j.rzp.orderId }) }).catch(() => {});
          setBusy(false); setErr("Payment was not completed, so the order wasn't placed. You can try again or choose another payment method.");
        } },
      });
      rp.open();
      return;
    }
    setBusy(false);
    setDone({ orderNo: j.orderNo, subtotal: j.subtotal }); clear(); window.scrollTo({ top: 0 });
  }

  if (done)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-10" /></div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">Order placed!</h1>
        <p className="mt-2 text-muted">Order <b className="text-foreground">#{done.orderNo}</b> · {rupee(done.subtotal)}</p>
        <p className="mt-4 text-sm text-muted">{storeName} will confirm your order shortly{method === "upi" ? " after checking your UPI payment" : ""}. Keep your phone handy.</p>
        <Link href={base || "/"} className="mt-8 inline-block rounded-pill bg-foreground px-7 py-3.5 text-sm font-bold text-background">Continue shopping</Link>
      </div>
    );

  if (!ready) return <div className="h-[50vh]" />;
  if (!lines.length)
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Your cart is empty</h1>
        <Link href={`${base}/shop`} className="mt-7 inline-block rounded-pill bg-foreground px-7 py-3.5 text-sm font-bold text-background">Start shopping</Link>
      </div>
    );

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const rateFor = (m: "cod" | "upi" | "razorpay") => (rules.freeAbove > 0 && total >= rules.freeAbove ? 0 : rules[m] || 0);
  const shipping = rateFor(method);
  // GST is per product (falls back to the store rate). It only changes the total when prices exclude GST.
  const gstExtra = rules.gstOn && !rules.inclusive ? Math.round(lines.reduce((n, l) => n + l.price * l.qty * (l.gst ?? rules.gstRate), 0)) / 100 : 0;
  const anyDelivery = rules.cod > 0 || rules.upi > 0 || rules.razorpay > 0;
  const grand = Math.round((total + gstExtra + shipping) * 100) / 100;
  const short = rules.minOrder > 0 && total < rules.minOrder ? rules.minOrder - total : 0;
  const upiLink = pay.vpa ? `upi://pay?pa=${encodeURIComponent(pay.vpa)}&pn=${encodeURIComponent(storeName)}&am=${grand.toFixed(2)}&cu=INR` : null;
  const toFree = anyDelivery && rules.freeAbove > 0 && total < rules.freeAbove ? rules.freeAbove - total : 0;
  const methods = [
    pay.razorpay && { k: "razorpay" as const, icon: CreditCard, t: "Pay online", d: "UPI, cards, net banking" },
    pay.upi && { k: "upi" as const, icon: Smartphone, t: "UPI transfer", d: pay.vpa || "Scan QR & share UTR" },
    pay.cod && { k: "cod" as const, icon: Banknote, t: "Cash on delivery", d: "Pay when it arrives" },
  ].filter(Boolean) as { k: "cod" | "upi" | "razorpay"; icon: typeof Banknote; t: string; d: string }[];
  const needPhone = Boolean(me && !me.phone);
  const blocked = Boolean(rules.closed) || short > 0 || needPhone;
  const cta = busy ? <Loader2 className="size-4 animate-spin" /> : rules.closed ? <>Store is closed</> : short > 0 ? <>Add {rupee(short)} more</> : needPhone ? <>Verify mobile to continue</> : <><Lock className="size-4" /> {method === "razorpay" ? "Pay" : "Place order"} · {rupee(grand)}</>;

  return (
    <form id="checkout" onSubmit={place} className="mx-auto max-w-6xl px-3 pt-5 pb-32 sm:px-6 sm:pt-8 lg:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout <span className="text-base font-semibold text-muted">· {count} item{count > 1 ? "s" : ""}</span></h1>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><ShieldCheck className="size-4 text-emerald-600" /> Safe & secure checkout</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_380px] lg:gap-6">
        <div className="space-y-4">
          <div className={box}>
            <div className="flex items-center justify-between">{step(1, "Your bag")}<Link href={`${base}/shop`} className="text-xs font-bold text-muted underline underline-offset-4">Add more</Link></div>
            <div className="mt-3 divide-y divide-border">
              {lines.map((l, i) => (
                <div key={`${l.id}-${l.variant}`} className="flex gap-3 py-3 first:pt-1 last:pb-0">
                  <Link href={`${base}/p/${l.slug}`} className="h-[72px] w-14 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image && <img src={l.image} alt="" className="size-full object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2"><p className="line-clamp-1 text-[14px] font-semibold">{l.name}</p><b className="shrink-0 text-[14px]">{rupee(l.price * l.qty)}</b></div>
                    <p className="text-xs text-muted">{l.variant ? `${l.variant} · ` : ""}{rupee(l.price)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <div className="flex items-center rounded-lg border border-border">
                        <button type="button" onClick={() => (l.qty > 1 ? setQty(i, l.qty - 1) : remove(i))} aria-label="Less" className="grid size-8 place-items-center"><Minus className="size-3.5" /></button>
                        <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                        <button type="button" onClick={() => setQty(i, l.qty + 1)} aria-label="More" className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                      </div>
                      <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-red-500"><Trash2 className="size-3.5" /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={box}>
            <div className="flex items-center justify-between">{step(2, "Delivery address")}{me === null && <Link href={`${base}/login?next=${encodeURIComponent(`${base}/cart`)}`} className="text-xs font-bold text-muted underline underline-offset-4">Have an account? Log in</Link>}</div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <input key={`n${me?.name ?? ""}`} name="name" required defaultValue={me?.name ?? ""} placeholder="Full name" autoComplete="name" className={field} />
              {me && !me.phone ? (
                <div className="sm:col-span-2">
                  <PhoneVerify title="Verify your mobile number" hint="For delivery updates. It's saved to your account." onDone={(p) => setMe({ ...me, phone: p })} />
                </div>
              ) : (
                <input key={`p${me?.phone ?? ""}`} name="phone" required defaultValue={me?.phone?.replace(/^\+?91/, "") ?? ""} inputMode="tel" maxLength={13} placeholder="Mobile number" autoComplete="tel" className={field} />
              )}
              <select name="state" required defaultValue="" className={cn(field, "sm:col-span-2")}><option value="" disabled>State</option>{GST_STATES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
              <textarea name="address" required rows={2} placeholder="House no, street, area, city, PIN code" autoComplete="street-address" className={cn(field, "resize-none sm:col-span-2")} />
              <input key={`e${me?.email ?? ""}`} name="email" type="email" defaultValue={me?.email ?? ""} placeholder="Email for order updates (optional)" autoComplete="email" className={cn(field, "sm:col-span-2")} />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <div className={box}>
            {step(3, "Payment")}
            <div className="mt-3 grid gap-2">
              {methods.map((m) => (
                <label key={m.k} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition", method === m.k ? "border-foreground bg-foreground/[.03] ring-1 ring-foreground" : "border-border")}>
                  <input type="radio" checked={method === m.k} onChange={() => setMethod(m.k)} className="accent-black" />
                  <m.icon className="size-5 shrink-0 text-foreground/70" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{m.t}</span><span className="block truncate text-xs text-muted">{m.d}</span></span>
                  {anyDelivery && <span className={cn("shrink-0 text-[11px] font-bold", rateFor(m.k) ? "text-muted" : "text-emerald-600")}>{rateFor(m.k) ? `+${rupee(rateFor(m.k))} delivery` : "FREE delivery"}</span>}
                </label>
              ))}
            </div>
            {method === "upi" && (
              <div className="mt-3 space-y-3 rounded-xl bg-foreground/[.03] p-3.5 text-sm">
                <p>Pay <b>{rupee(grand)}</b> to {pay.vpa ? <b className="break-all">{pay.vpa}</b> : "the QR below"}, then enter the UTR / transaction ID.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {pay.qr && <img src={pay.qr} alt="UPI QR" className="mx-auto w-40 rounded-xl bg-white p-2" />}
                {upiLink && <a href={upiLink} className="block rounded-full bg-foreground py-2.5 text-center text-sm font-bold text-background sm:hidden">Open UPI app</a>}
                <input name="utr" required placeholder="UTR / UPI transaction ID" inputMode="numeric" className={field} />
              </div>
            )}
          </div>

          <div className={box}>
            <p className="text-[11px] font-bold tracking-[2.5px] text-muted">PRICE DETAILS</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Items ({count})</span><span>{rupee(total)}</span></div>
              {gstExtra > 0 && <div className="flex justify-between"><span className="text-muted">GST</span><span>{rupee(gstExtra)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className={shipping ? "" : "font-semibold text-emerald-600"}>{shipping ? rupee(shipping) : "FREE"}</span></div>
              <div className="flex justify-between border-t border-dashed border-border pt-2.5 font-display text-lg font-extrabold"><span>Total</span><span>{rupee(grand)}</span></div>
              {rules.gstOn && rules.inclusive && <p className="text-[11px] text-muted">Prices include GST.</p>}
            </div>
            {toFree > 0 && <p className="mt-3 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">Add {rupee(toFree)} more for FREE delivery</p>}
            {short > 0 && <p className="mt-3 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-700">Minimum order is {rupee(rules.minOrder)}.</p>}
            {rules.closed && <p className="mt-3 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">{rules.closed}</p>}
            {err && <p className="mt-3 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">{err}</p>}
            <button disabled={busy || blocked} className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-foreground py-4 text-sm font-extrabold tracking-wide text-background uppercase disabled:opacity-60 lg:flex">{cta}</button>
            <p className="mt-3 text-center text-[11px] text-muted">By placing the order you agree to the store&apos;s terms.</p>
          </div>
        </div>
      </div>

      {/* phone / tablet sticky pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-2.5 pb-[max(.7rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        {err && <p className="mb-2 line-clamp-2 text-xs font-semibold text-red-500">{err}</p>}
        <div className="flex items-center gap-3">
          <div className="pl-1"><p className="text-[11px] text-muted">{count} item{count > 1 ? "s" : ""}{shipping ? " + shipping" : ""}</p><p className="font-display text-lg leading-tight font-extrabold">{rupee(grand)}</p></div>
          <button disabled={busy || blocked} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-[13px] font-extrabold tracking-wide text-background uppercase disabled:opacity-60">{cta}</button>
        </div>
      </div>
    </form>
  );
}
