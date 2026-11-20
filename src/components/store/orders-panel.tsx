"use client";
import { useState } from "react";
import { BadgeCheck, ChevronLeft, Inbox, Phone, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { api, card, inr } from "./ui";

export type O = {
  id: number; order_no: string; name: string; phone: string; email: string | null; address: string | null;
  items: { id: number; name: string; variant: string | null; price: number; qty: number }[];
  subtotal: number; pay_method: string; utr: string | null; pay_status: string; status: string; note: string | null; created_at: string;
};
const STEPS = ["new", "confirmed", "shipped", "delivered"];
const COLORS: Record<string, string> = { new: "bg-blue-500/10 text-blue-600", confirmed: "bg-violet-500/10 text-violet-600", shipped: "bg-amber-500/10 text-amber-600", delivered: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-red-500/10 text-red-500" };
const when = (v: string) => new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

export function OrdersPanel({ orders, setOrders }: { orders: O[]; setOrders: (o: O[]) => void }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<O | null>(null);
  const list = orders.filter((o) => filter === "all" || o.status === filter);

  async function patch(o: O, body: Partial<O>) {
    const next = { ...o, ...body };
    setOrders(orders.map((x) => (x.id === o.id ? next : x)));
    setOpen(next);
    await api(`/api/store/orders/${o.id}`, "PATCH", body);
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...STEPS, "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold capitalize", filter === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
            {s}{s === "all" ? ` (${orders.length})` : ` (${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className={cn(card, "mt-5 p-10 text-center")}><Inbox className="mx-auto size-8 text-muted" /><p className="mt-3 font-semibold">No orders yet</p><p className="mt-1 text-sm text-muted">Share your store link — new orders show up here.</p></div>
      ) : (
        <div className="mt-5 space-y-3">
          {list.map((o) => (
            <button key={o.id} onClick={() => setOpen(o)} className={cn(card, "block w-full p-4 text-left")}>
              <div className="flex items-center justify-between gap-3"><p className="font-semibold">{o.name}</p><p className="font-display font-bold">{inr(o.subtotal)}</p></div>
              <p className="mt-0.5 text-xs text-muted">#{o.order_no} · {when(o.created_at)} · {o.items.reduce((n, i) => n + i.qty, 0)} item(s)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", COLORS[o.status])}>{o.status}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", o.pay_status === "verified" || o.pay_status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/5 text-muted")}>
                  {o.pay_method.toUpperCase()} · {o.pay_status === "pending" && o.pay_method === "upi" ? "verify UTR" : o.pay_status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-background sm:items-center sm:justify-center sm:bg-black/50 sm:p-6">
          <div className="flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[92dvh] sm:max-w-xl sm:rounded-[2rem] sm:border sm:border-border">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button onClick={() => setOpen(null)} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><ChevronLeft className="size-5 sm:hidden" /><X className="hidden size-5 sm:block" /></button>
              <div className="flex-1"><h2 className="font-display text-lg font-bold">Order #{open.order_no}</h2><p className="text-xs text-muted">{when(open.created_at)}</p></div>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              <div className={cn(card, "p-4")}>
                <p className="font-semibold">{open.name}</p>
                <p className="mt-1 text-sm text-muted whitespace-pre-line">{open.address}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${open.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Phone className="size-4" /> Call</a>
                  <a href={`https://wa.me/${open.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${open.name}, about your order #${open.order_no}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><FaWhatsapp className="size-4" /> WhatsApp</a>
                </div>
              </div>
              <div className={cn(card, "divide-y divide-border")}>
                {open.items.map((i, k) => (
                  <div key={k} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{i.name}{i.variant ? <span className="text-muted"> · {i.variant}</span> : null} × {i.qty}</span><b>{inr(i.price * i.qty)}</b></div>
                ))}
                <div className="flex justify-between px-4 py-3 font-display font-bold"><span>Total</span><span>{inr(open.subtotal)}</span></div>
              </div>
              <div className={cn(card, "p-4")}>
                <p className="text-xs font-bold tracking-widest text-muted">PAYMENT</p>
                <p className="mt-1.5 text-sm"><b>{open.pay_method === "cod" ? "Cash on delivery" : "UPI"}</b>{open.utr ? <> · UTR <span className="font-mono font-semibold">{open.utr}</span></> : null}</p>
                <p className="mt-0.5 text-xs text-muted">Status: {open.pay_status}</p>
                {open.pay_status !== "verified" && open.pay_status !== "paid" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => patch(open, { pay_status: open.pay_method === "cod" ? "paid" : "verified" })} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><BadgeCheck className="size-4" /> {open.pay_method === "cod" ? "Mark cash received" : "UTR verified"}</button>
                    {open.pay_method === "upi" && <button onClick={() => patch(open, { pay_status: "failed" })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-red-500">Not received</button>}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold tracking-widest text-muted">ORDER STATUS</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STEPS.map((s) => <button key={s} onClick={() => patch(open, { status: s })} className={cn("rounded-2xl border px-3 py-3 text-sm font-semibold capitalize", open.status === s ? "border-foreground bg-foreground text-background" : "border-border")}>{s}</button>)}
                </div>
                {open.status !== "cancelled" && <button onClick={() => confirm("Cancel this order?") && patch(open, { status: "cancelled" })} className="mt-3 text-sm font-semibold text-red-500">Cancel order</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
