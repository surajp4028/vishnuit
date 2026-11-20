"use client";
import { useEffect, useRef } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type T = { id: string; name: string; place: string; text: string; rating: number };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const Stars = ({ n, size = "size-3.5" }: { n: number; size?: string }) => (
  <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={cn(size, k <= Math.round(n) ? "fill-amber-400 text-amber-400" : "text-foreground/15")} />)}</span>
);

function Card({ t }: { t: T }) {
  return (
    <figure className="relative flex w-[290px] shrink-0 flex-col rounded-3xl border border-border bg-card p-6 sm:w-[360px]">
      <Quote className="absolute top-5 right-5 size-8 text-foreground/[.07]" />
      <Stars n={t.rating} />
      <blockquote className="mt-4 line-clamp-5 flex-1 text-[14.5px] leading-relaxed text-foreground/85">&ldquo;{t.text}&rdquo;</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-[12px] font-bold text-background">{initials(t.name)}</span>
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{t.name}</span>{t.place && <span className="block truncate text-xs text-muted">{t.place}</span>}</span>
      </figcaption>
    </figure>
  );
}

/** Customer reviews as gently scrolling rows (same feel as the main site). Pauses on hover. */
export function Testimonials({ reviews }: { reviews: T[] }) {
  const n = reviews.length;
  if (!n) return null;
  const avg = reviews.reduce((a, t) => a + t.rating, 0) / n;
  // Two rows once there are enough reviews; each row repeated so the loop never shows a gap.
  const rows = n >= 6 ? [reviews.slice(0, Math.ceil(n / 2)), reviews.slice(Math.ceil(n / 2))] : [reviews];
  const fill = (row: T[]) => { let out = row; while (out.length < 8) out = [...out, ...row]; return out; };
  return (
    <section className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-7xl px-3 text-center sm:px-6">
        <p className="text-[11px] font-bold tracking-[4px] text-muted">LOVED BY CUSTOMERS</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">What our shoppers say</h2>
        <div className="mt-4 inline-flex items-center gap-3 rounded-pill border border-border bg-card px-4 py-2">
          <span className="font-display text-xl font-extrabold">{avg.toFixed(1)}</span>
          <Stars n={avg} size="size-4" />
          <span className="text-xs text-muted">from {n} review{n === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="mt-8 space-y-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        {rows.map((row, r) => <Row key={r} items={fill(row)} reverse={r === 1} />)}
      </div>
    </section>
  );
}

/**
 * One endlessly scrolling row. It drifts on its own, pauses on hover / touch,
 * and can be dragged with the mouse or swiped with a finger in either direction.
 */
function Row({ items, reverse }: { items: T[]; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let paused = false, raf = 0, last = performance.now();
    let drag: { x: number; left: number } | null = null;
    const half = () => el.scrollWidth / 2;
    // pos keeps sub-pixel progress (browsers round scrollLeft), and stays within one copy of the list so it loops both ways.
    let pos = reverse ? half() - 1 : 1;
    const norm = (v: number) => { const h = half(); return h > 0 ? ((v % h) + h) % h || 1 : v; };
    const apply = () => { el.scrollLeft = pos; };
    apply();
    const tick = (t: number) => {
      const dt = Math.min(64, t - last); last = t;
      if (!paused && !drag && !reduce) { pos = norm(pos + (reverse ? -1 : 1) * dt * 0.035); apply(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Mouse: drag to scroll. Touch: native swipe (we just pause and pick up from where the finger left it).
    const down = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, left: pos }; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => { if (!drag) return; pos = norm(drag.left - (e.clientX - drag.x)); apply(); };
    const up = () => { drag = null; el.style.cursor = ""; };
    const onScroll = () => { if (Math.abs(el.scrollLeft - pos) > 2) { pos = norm(el.scrollLeft); if (pos !== el.scrollLeft) apply(); } };
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    let touchTimer = 0;
    const touch = () => { paused = true; clearTimeout(touchTimer); touchTimer = window.setTimeout(() => { paused = false; }, 2500); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", touch, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf); clearTimeout(touchTimer);
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      el.removeEventListener("mouseenter", pause); el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", touch); el.removeEventListener("scroll", onScroll);
    };
  }, [reverse]);
  return (
    <div ref={ref} className="flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain px-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {[...items, ...items].map((t, i) => <Card key={`${t.id}-${i}`} t={t} />)}
    </div>
  );
}
