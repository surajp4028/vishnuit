"use client";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal snap carousel: 2 cards per view on phones, 3 on tablets, 4 on desktop, with arrows. */
export function RelatedCarousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const items = Children.toArray(children);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    upd();
    el.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    return () => { el.removeEventListener("scroll", upd); window.removeEventListener("resize", upd); };
  }, []);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  const arrow = "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 shadow-lg backdrop-blur transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:grid";

  return (
    <div className="relative mt-6">
      <div ref={ref} className="-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:-mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((c, i) => (
          <div key={i} className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]">{c}</div>
        ))}
      </div>
      <button type="button" aria-label="Previous" onClick={() => go(-1)} disabled={edge.start} className={cn(arrow, "-left-5")}><ChevronLeft className="size-5" /></button>
      <button type="button" aria-label="Next" onClick={() => go(1)} disabled={edge.end} className={cn(arrow, "-right-5")}><ChevronRight className="size-5" /></button>
    </div>
  );
}
