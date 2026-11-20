"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type T = { id: string; name: string; place: string; text: string; rating: number };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const Stars = ({ n, size = "size-4" }: { n: number; size?: string }) => <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={cn(size, k <= Math.round(n) ? "fill-amber-400 text-amber-400" : "text-foreground/15")} />)}</span>;

/** Editorial testimonial slider: rating summary on the left, one big quote on the right. Auto-plays, pauses on hover. */
export function Testimonials({ reviews }: { reviews: T[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = reviews.length;
  const avg = reviews.reduce((a, t) => a + t.rating, 0) / n;
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section className="mx-auto mt-16 max-w-7xl px-3 sm:mt-24 sm:px-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="grid overflow-hidden rounded-3xl border border-border md:grid-cols-[.85fr_1.4fr]">
        <div className="flex flex-col justify-between gap-8 bg-foreground/[.03] p-7 sm:p-10">
          <div>
            <p className="text-[11px] font-bold tracking-[4px] text-muted">LOVED BY CUSTOMERS</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] font-extrabold tracking-tight sm:text-[2.6rem]">Real words from real shoppers</h2>
          </div>
          <div>
            <div className="flex items-end gap-3"><span className="font-display text-6xl leading-none font-extrabold tracking-tight">{avg.toFixed(1)}</span><span className="pb-1"><Stars n={avg} /><span className="mt-1 block text-xs text-muted">from {n} review{n > 1 ? "s" : ""}</span></span></div>
            {n > 1 && (
              <div className="mt-7 flex items-center gap-3">
                <button onClick={() => go(-1)} aria-label="Previous review" className="grid size-11 place-items-center rounded-full border border-border bg-background transition hover:border-foreground"><ArrowLeft className="size-4" /></button>
                <button onClick={() => go(1)} aria-label="Next review" className="grid size-11 place-items-center rounded-full bg-foreground text-background transition hover:opacity-90"><ArrowRight className="size-4" /></button>
                <span className="ml-2 font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative min-h-[320px] p-7 sm:min-h-[360px] sm:p-12">
          <span aria-hidden className="pointer-events-none absolute top-2 right-6 font-display text-[9rem] leading-none text-foreground/[.06] sm:text-[12rem]">&rdquo;</span>
          {reviews.map((t, k) => (
            <figure key={t.id} aria-hidden={k !== i} className={cn("absolute inset-7 flex flex-col transition-all duration-700 sm:inset-12", k === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")}>
              <Stars n={t.rating} size="size-[18px]" />
              <blockquote className="mt-5 line-clamp-6 flex-1 font-display text-xl leading-snug font-semibold tracking-tight sm:text-[1.7rem]">“{t.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-foreground text-sm font-bold text-background">{initials(t.name)}</span>
                <span><span className="block font-semibold capitalize">{t.name}</span><span className="block text-xs text-muted">{t.place || "Happy customer"}</span></span>
              </figcaption>
            </figure>
          ))}
          {n > 1 && (
            <div className="absolute right-7 bottom-7 hidden gap-1.5 sm:right-12 sm:bottom-12 sm:flex">
              {reviews.map((t, k) => <button key={t.id} onClick={() => setI(k)} aria-label={`Review by ${t.name}`} className={cn("grid size-9 place-items-center rounded-full text-[11px] font-bold transition", k === i ? "bg-foreground text-background" : "bg-foreground/[.06] text-muted hover:bg-foreground/10")}>{initials(t.name)}</button>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
