"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { id: number; slug: string; name: string; image: string | null; variant: string | null; price: number; qty: number; gst?: number | null };
type Ctx = { lines: CartLine[]; count: number; total: number; add: (l: CartLine) => void; setQty: (i: number, q: number) => void; remove: (i: number) => void; clear: () => void; ready: boolean };
const CartCtx = createContext<Ctx | null>(null);

/** Per-store cart kept on the phone (localStorage). Prices are re-checked by the server at checkout. */
export function CartProvider({ handle, children }: { handle: string; children: React.ReactNode }) {
  const key = `vit-cart:${handle}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
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
    if (i < 0) return [...ls, l];
    const next = ls.slice(); next[i] = { ...next[i], qty: Math.min(99, next[i].qty + l.qty), price: l.price }; return next;
  }), []);
  const value = useMemo<Ctx>(() => ({
    lines, ready, add,
    count: lines.reduce((n, l) => n + l.qty, 0),
    total: Math.round(lines.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100,
    setQty: (i, q) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, qty: Math.max(1, Math.min(99, q)) } : l))),
    remove: (i) => setLines((ls) => ls.filter((_, j) => j !== i)),
    clear: () => setLines([]),
  }), [lines, ready, add]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const rupee = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
