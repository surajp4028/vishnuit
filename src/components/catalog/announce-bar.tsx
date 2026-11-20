"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Black offers strip above the store header: one message at a time, arrows to switch, auto-advances (pauses on hover). */
export function AnnounceBar({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n, paused]);
  if (!n) return null;
  return (
    <div className="bg-[#0a0b10] text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto flex h-9 max-w-3xl items-center gap-2 px-2 sm:h-10">
        {n > 1 && <button onClick={() => setI((x) => (x - 1 + n) % n)} aria-label="Previous offer" className="grid size-7 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"><ChevronLeft className="size-4" /></button>}
        <div className="relative h-full flex-1 overflow-hidden">
          {items.map((t, k) => (
            <p key={k} aria-hidden={k !== i} className={cn("absolute inset-0 flex items-center justify-center truncate px-1 text-center text-[11px] font-semibold tracking-[1.5px] uppercase transition-all duration-500 sm:text-xs", k === i ? "translate-y-0 opacity-100" : k < i ? "-translate-y-full opacity-0" : "translate-y-full opacity-0")}>{t}</p>
          ))}
        </div>
        {n > 1 && <button onClick={() => setI((x) => (x + 1) % n)} aria-label="Next offer" className="grid size-7 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"><ChevronRight className="size-4" /></button>}
      </div>
    </div>
  );
}
