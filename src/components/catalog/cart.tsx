"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { id: number; slug: string; name: string; image: string | null; variant: string | null; price: number; qty: number; gst?: number | null; max?: number | null };
type Ctx = { syncPrices: (p: { id: number; variant: string | null; price: number; gst: number | null }[]) => void; open: boolean; setOpen: (v: boolean) => void; lines: CartLine[]; count: number; total: number; add: (l: CartLine) => void; setQty: (i: number, q: number) => void; remove: (i: number) => void; clear: () => void; ready: boolean };
const CartCtx = createContext<Ctx | null>(null);

/** Per-store cart kept on the phone (localStorage). Prices are re-checked by the server at checkout. */
export function CartProvider({ handle, children }: { handle: string; children: React.ReactNode }) {
  const key = `vit-cart:${handle}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(key) || "[]")); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(lines)); } catch {}
  }, [key, lines, ready]);

  const add = useCallback((l: CartLine) => setLines((ls) => {
    const i = ls.findIndex((x) => x.id === l.id && x.variant === l.variant);
    const cap = Math.min(99, l.max ?? 99);
    if (i < 0) return [...ls, { ...l, qty: Math.max(1, Math.min(cap, l.qty)) }];
    const next = ls.slice(); next[i] = { ...next[i], qty: Math.min(cap, next[i].qty + l.qty), price: l.price, max: l.max ?? null }; return next;
  }), []);
  const value = useMemo<Ctx>(() => ({
    lines, ready, add, open, setOpen,
    // Replace prices saved in the browser with today's prices from the server (checkout quote).
    syncPrices: (p) => setLines((ls) => {
      let changed = false;
      const next = ls.map((l) => { const s = p.find((x) => x.id === l.id && (x.variant ?? null) === (l.variant ?? null)); if (s && (s.price !== l.price || (s.gst ?? null) !== (l.gst ?? null))) { changed = true; return { ...l, price: s.price, gst: s.gst }; } return l; });
      return changed ? next : ls;
    }),
    count: lines.reduce((n, l) => n + l.qty, 0),
    total: Math.round(lines.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100,
    setQty: (i, q) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, qty: Math.max(1, Math.min(Math.min(99, l.max ?? 99), q)) } : l))),
    remove: (i) => setLines((ls) => ls.filter((_, j) => j !== i)),
    clear: () => setLines([]),
  }), [lines, ready, add, open]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const rupee = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
