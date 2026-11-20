"use client";
import { useState } from "react";
import { BadgeCheck, ChevronLeft, Download, FileText, Inbox, Phone, Truck, Undo2, X } from "lucide-react";
import { ORDER_COLOR, ORDER_FLOW, ORDER_LABEL, PAY_COLOR, PAY_LABEL, PAY_STATUSES, type StatusLog, type Tracking } from "@/lib/order-status";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { api, card, inr } from "./ui";

export type O = {
  id: number; order_no: string; name: string; phone: string; email: string | null; address: string | null;
  items: { id: number; name: string; variant: string | null; price: number; qty: number }[];
  subtotal: number; pay_method: string; utr: string | null; pay_status: string; status: string; note: string | null; created_at: string; invoice?: string; buyer_gstin?: string | null; buyer_company?: string | null;
  status_log?: StatusLog; tracking?: Tracking | null; shipping?: number;
};
const FILTERS = ["all", "new", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "pay:pending"];
const PAY_METHOD: Record<string, string> = { cod: "Cash on delivery", upi: "UPI", razorpay: "Online (Razorpay)" };
const when = (v: string) => new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

export function OrdersPanel({ orders, setOrders, openId }: { orders: O[]; setOrders: (o: O[]) => void; openId?: number }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<O | null>(() => orders.find((o) => o.id === openId) ?? null);
  const match = (o: O, f: string) => f === "all" || (f === "pay:pending" ? o.pay_status === "pending" && o.status !== "cancelled" : o.status === f);
  const list = orders.filter((o) => match(o, filter));
  const [trk, setTrk] = useState<Tracking>({ courier: "", number: "", url: "" });
  const [note, setNote] = useState("");
  const openOrder = (o: O | null) => { setOpen(o); setTrk(o?.tracking ?? { courier: "", number: "", url: "" }); setNote(o?.note ?? ""); };

  async function patch(o: O, body: Partial<O>) {
    const next = { ...o, ...body, ...(body.status && body.status !== o.status ? { status_log: [...(o.status_log ?? []), { s: body.status, at: new Date().toISOString() }] } : {}) };
    setOrders(orders.map((x) => (x.id === o.id ? next : x)));
    setOpen(next);
    await api(`/api/store/orders/${o.id}`, "PATCH", body);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end"><a href="/api/store/orders/export" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold"><Download className="size-4" /> Export CSV</a></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.filter((s) => s === "all" || s === "new" || orders.some((o) => match(o, s))).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold whitespace-nowrap", filter === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
            {s === "all" ? "All" : s === "pay:pending" ? "Payment pending" : ORDER_LABEL[s]} ({orders.filter((o) => match(o, s)).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className={cn(card, "mt-5 p-10 text-center")}><Inbox className="mx-auto size-8 text-muted" /><p className="mt-3 font-semibold">No orders yet</p><p className="mt-1 text-sm text-muted">Share your store link — new orders show up here.</p></div>
      ) : (
        <div className="mt-5 space-y-3">
          {list.map((o) => (
            <button key={o.id} onClick={() => openOrder(o)} className={cn(card, "block w-full p-4 text-left")}>
              <div className="flex items-center justify-between gap-3"><p className="font-semibold">{o.name}</p><p className="font-display font-bold">{inr(o.subtotal)}</p></div>
              <p className="mt-0.5 text-xs text-muted">#{o.order_no} · {when(o.created_at)} · {o.items.reduce((n, i) => n + i.qty, 0)} item(s)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", ORDER_COLOR[o.status])}>{ORDER_LABEL[o.status] ?? o.status}</span>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", PAY_COLOR[o.pay_status] ?? "bg-foreground/5 text-muted")}>
                  {o.pay_method.toUpperCase()} · {o.pay_status === "pending" && o.pay_method === "upi" ? "verify UTR" : PAY_LABEL[o.pay_status] ?? o.pay_status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        // Right-side panel (full screen on phones); tap outside to close.
        <div onClick={() => openOrder(null)} className="fixed inset-0 z-[80] flex justify-end bg-black/40 backdrop-blur-[2px] animate-[fadeIn_.2s_ease]">
          <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full animate-[slideInRight_.32s_cubic-bezier(.2,.8,.2,1)] flex-col bg-background shadow-[-30px_0_80px_-20px_rgba(0,0,0,.35)] sm:max-w-xl sm:rounded-l-[2rem] sm:border-l sm:border-border">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button onClick={() => openOrder(null)} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><ChevronLeft className="size-5 sm:hidden" /><X className="hidden size-5 sm:block" /></button>
              <div className="flex-1"><h2 className="font-display text-lg font-bold">Order #{open.order_no}</h2><p className="text-xs text-muted">{when(open.created_at)}</p></div>
              {open.invoice && <a href={open.invoice} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold"><FileText className="size-4" /> Invoice</a>}
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              <div className={cn(card, "p-4")}>
                <p className="font-semibold">{open.name}</p>
                <p className="mt-1 text-sm text-muted whitespace-pre-line">{open.address}</p>
                {open.buyer_gstin && <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-foreground/[.05] px-2.5 py-1 text-xs"><b>GSTIN</b><span className="font-mono">{open.buyer_gstin}</span>{open.buyer_company && <span className="text-muted">· {open.buyer_company}</span>}</p>}
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${open.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Phone className="size-4" /> Call</a>
                  <a href={`https://wa.me/${open.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${open.name}, about your order #${open.order_no}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><FaWhatsapp className="size-4" /> WhatsApp</a>
                </div>
              </div>
              <div className={cn(card, "divide-y divide-border")}>
                {open.items.map((i, k) => (
                  <div key={k} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{i.name}{i.variant ? <span className="text-muted"> · {i.variant}</span> : null} × {i.qty}</span><b>{inr(i.price * i.qty)}</b></div>
                ))}
                {open.shipping ? <div className="flex justify-between px-4 py-2.5 text-sm text-muted"><span>Shipping</span><span>{inr(open.shipping)}</span></div> : null}
                <div className="flex justify-between px-4 py-3 font-display font-bold"><span>Total charged</span><span>{inr(open.subtotal)}</span></div>
              </div>
              <div className={cn(card, "p-4")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold tracking-widest text-muted">PAYMENT</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", PAY_COLOR[open.pay_status])}>{PAY_LABEL[open.pay_status] ?? open.pay_status}</span>
                </div>
                <p className="mt-1.5 text-sm"><b>{PAY_METHOD[open.pay_method] ?? open.pay_method}</b>{open.utr ? <> · UTR <span className="font-mono font-semibold">{open.utr}</span></> : null}</p>
                {open.pay_status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => patch(open, { pay_status: open.pay_method === "upi" ? "verified" : "paid" })} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><BadgeCheck className="size-4" /> {open.pay_method === "cod" ? "Mark cash received" : open.pay_method === "upi" ? "UTR verified" : "Mark paid"}</button>
                    {open.pay_method === "upi" && <button onClick={() => patch(open, { pay_status: "failed" })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-red-500">Not received</button>}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PAY_STATUSES.filter((p) => p !== open.pay_status).map((p) => <button key={p} onClick={() => (p !== "refunded" || confirm("Mark this order as refunded?")) && patch(open, { pay_status: p })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground">Set “{PAY_LABEL[p]}”</button>)}
                </div>
              </div>

              <div className={cn(card, "p-4")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold tracking-widest text-muted">ORDER STATUS</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", ORDER_COLOR[open.status])}>{ORDER_LABEL[open.status] ?? open.status}</span>
                </div>
                {open.status === "cancelled" || open.status === "returned" ? (
                  <button onClick={() => patch(open, { status: "confirmed" })} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Undo2 className="size-4" /> Re-open order</button>
                ) : (
                  <ol className="mt-4 space-y-1">
                    {ORDER_FLOW.map((s, k) => {
                      const cur = ORDER_FLOW.indexOf(open.status as (typeof ORDER_FLOW)[number]);
                      const done = k <= cur;
                      const at = [...(open.status_log ?? [])].reverse().find((l) => l.s === s)?.at;
                      return (
                        <li key={s}>
                          <button onClick={() => patch(open, { status: s })} className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-foreground/5", k === cur && "bg-foreground/5")}>
                            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-muted")}>{done ? "✓" : k + 1}</span>
                            <span className={cn("flex-1 font-semibold", !done && "text-muted")}>{ORDER_LABEL[s]}</span>
                            {at && done && <span className="text-[11px] text-muted">{when(at)}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {open.status !== "cancelled" && open.status !== "returned" && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {open.status !== "delivered" && <button onClick={() => confirm("Cancel this order? Stock will be added back.") && patch(open, { status: "cancelled" })} className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500">Cancel order</button>}
                    {open.status === "delivered" && <button onClick={() => confirm("Mark as returned? Stock will be added back.") && patch(open, { status: "returned" })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Mark returned</button>}
                  </div>
                )}
              </div>

              {["packed", "shipped", "out_for_delivery", "delivered"].includes(open.status) && (
                <div className={cn(card, "space-y-2.5 p-4")}>
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted"><Truck className="size-4" /> TRACKING (shown to customer)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={trk.courier} onChange={(e) => setTrk({ ...trk, courier: e.target.value })} placeholder="Courier e.g. Delhivery" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40" />
                    <input value={trk.number} onChange={(e) => setTrk({ ...trk, number: e.target.value })} placeholder="Tracking / AWB number" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40" />
                  </div>
                  <input value={trk.url} onChange={(e) => setTrk({ ...trk, url: e.target.value })} placeholder="Tracking link (optional) https://…" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40" />
                  <button onClick={async () => { const r = await api(`/api/store/orders/${open.id}`, "PATCH", { tracking: trk }); if (r.ok) { patch(open, { tracking: trk }); } else alert((r.data as { error?: string }).error || "Could not save"); }} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">Save tracking</button>
                </div>
              )}

              <div className={cn(card, "space-y-2 p-4")}>
                <p className="text-xs font-bold tracking-widest text-muted">PRIVATE NOTE</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (open.note ?? "") && patch(open, { note })} rows={2} placeholder="Only you can see this" className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
