"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Slide = { id: string; url: string; title: string; subtitle: string; cta: string; link: string };

/** Auto-sliding hero banners. Swipe on phones, arrows on desktop, pauses on hover/touch. */
export function HeroCarousel({ slides, interval, fallbackLink }: { slides: Slide[]; interval: number; fallbackLink: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => {
    const el = ref.current;
    if (!el) return;
    const k = (n + slides.length) % slides.length;
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = setInterval(() => go(i + 1), Math.max(2, interval) * 1000);
    return () => clearInterval(t);
  }, [i, paused, interval, go, slides.length]);

  return (
    <div className="group relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}>
      <div ref={ref} onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / el.clientWidth)); }} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:rounded-3xl [&::-webkit-scrollbar]:hidden">
        {slides.map((s, n) => {
          const href = s.link || fallbackLink;
          const inner = (
            <div className="relative isolate aspect-[4/5] w-full overflow-hidden bg-[#0b0d12] text-white sm:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.title || ""} loading={n ? "lazy" : "eager"} className="absolute inset-0 -z-10 size-full object-cover" />
              {(s.title || s.subtitle || s.cta) && (
                <>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/15 to-transparent sm:bg-gradient-to-r sm:from-black/65 sm:via-black/20" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:top-0 sm:flex sm:max-w-xl sm:flex-col sm:justify-end sm:p-12">
                    {s.title && <h2 className="font-display text-[2.2rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl">{s.title}</h2>}
                    {s.subtitle && <p className="mt-3 max-w-md text-[15px] text-white/85">{s.subtitle}</p>}
                    {s.cta && <span className="mt-6 inline-flex w-max items-center gap-2 rounded-pill bg-white px-6 py-3 text-[13px] font-bold tracking-wide text-black uppercase transition group-hover:gap-3">{s.cta} <ArrowRight className="size-4" /></span>}
                  </div>
                </>
              )}
            </div>
          );
          return (
            <div key={s.id} className="w-full shrink-0 snap-center">
              {href.startsWith("/") ? <Link href={href} className="block">{inner}</Link> : <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>}
            </div>
          );
        })}
      </div>
      {slides.length > 1 && (
        <>
          <button onClick={() => go(i - 1)} aria-label="Previous slide" className="absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition group-hover:opacity-100 sm:grid"><ChevronLeft className="size-5" /></button>
          <button onClick={() => go(i + 1)} aria-label="Next slide" className="absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition group-hover:opacity-100 sm:grid"><ChevronRight className="size-5" /></button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:bottom-5">
            {slides.map((s, n) => <button key={s.id} onClick={() => go(n)} aria-label={`Slide ${n + 1}`} className={cn("h-1.5 rounded-full bg-white transition-all", n === i ? "w-6" : "w-1.5 opacity-50")} />)}
          </div>
        </>
      )}
    </div>
  );
}
