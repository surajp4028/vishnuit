"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Sticky side column that also works when it's taller than the screen:
 * short → sticks under the header; tall → scrolls until its bottom is visible, then sticks.
 */
export function StickyColumn({ children, className = "", offset = 128 }: { children: React.ReactNode; className?: string; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(offset);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => setTop(Math.min(offset, window.innerHeight - el.offsetHeight - 24));
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener("resize", calc);
    return () => { ro.disconnect(); window.removeEventListener("resize", calc); };
  }, [offset]);
  return <div ref={ref} className={`md:sticky md:self-start ${className}`} style={{ top }}>{children}</div>;
}
