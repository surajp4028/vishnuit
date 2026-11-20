"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Full-screen photo viewer: swipe/arrows between photos, zoom by double-tap, pinch, wheel or buttons,
 * drag to pan when zoomed, thumbnails, Esc to close.
 */
export function Lightbox({ images, start, onClose, alt }: { images: string[]; start: number; onClose: () => void; alt: string }) {
  const [i, setI] = useState(start);
  const [z, setZ] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; z: number; x: number; y: number; px: number; py: number; swipeX: number | null }>({ dist: 0, z: 1, x: 0, y: 0, px: 0, py: 0, swipeX: null });
  const lastTap = useRef(0);
  const n = images.length;
  const reset = () => { setZ(1); setPan({ x: 0, y: 0 }); };
  const go = useCallback((d: number) => { setI((x) => (x + d + n) % n); setZ(1); setPan({ x: 0, y: 0 }); }, [n]);
  const zoomTo = (nz: number) => { const c = Math.min(4, Math.max(1, nz)); setZ(c); if (c === 1) setPan({ x: 0, y: 0 }); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [go, onClose]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      g.dist = Math.hypot(a.x - b.x, a.y - b.y); g.z = z;
    } else {
      g.x = e.clientX; g.y = e.clientY; g.px = pan.x; g.py = pan.y; g.swipeX = z === 1 ? e.clientX : null;
      const now = Date.now();
      if (now - lastTap.current < 280) { if (z > 1) reset(); else zoomTo(2.5); }
      lastTap.current = now;
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      zoomTo(g.z * (Math.hypot(a.x - b.x, a.y - b.y) / (g.dist || 1)));
    } else if (z > 1) {
      setPan({ x: g.px + (e.clientX - g.x), y: g.py + (e.clientY - g.y) });
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (pts.current.size === 1 && g.swipeX != null && z === 1) {
      const dx = e.clientX - g.swipeX;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    }
    pts.current.delete(e.pointerId);
    g.swipeX = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/95 text-white" role="dialog" aria-label={`${alt} photos`}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white/70">{i + 1} / {n}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomTo(z - 0.75)} disabled={z <= 1} aria-label="Zoom out" className="grid size-10 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"><ZoomOut className="size-5" /></button>
          <button onClick={() => zoomTo(z + 0.75)} disabled={z >= 4} aria-label="Zoom in" className="grid size-10 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"><ZoomIn className="size-5" /></button>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X className="size-6" /></button>
        </div>
      </div>
      <div
        className={cn("relative flex-1 touch-none overflow-hidden select-none", z > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onWheel={(e) => zoomTo(z - e.deltaY * 0.004)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={alt} draggable={false} className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform duration-150 ease-out" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${z})` }} />
        {n > 1 && z === 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} onPointerDown={(e) => e.stopPropagation()} aria-label="Previous photo" className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:grid"><ChevronLeft className="size-6" /></button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} onPointerDown={(e) => e.stopPropagation()} aria-label="Next photo" className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:grid"><ChevronRight className="size-6" /></button>
          </>
        )}
        {z === 1 && <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-white/50">Double-tap or pinch to zoom{n > 1 ? " · swipe for more" : ""}</p>}
      </div>
      {n > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {images.map((src, k) => (
            <button key={k} onClick={() => { setI(k); reset(); }} className={cn("h-16 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition", k === i ? "ring-white" : "opacity-50 ring-transparent hover:opacity-90")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
