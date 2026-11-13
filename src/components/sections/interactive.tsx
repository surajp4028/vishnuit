"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, animate } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./blocks";
import type { ProjectT } from "@/lib/server/content";

/* ---------------- Count-up stats ---------------- */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, value]);
  const dec = value % 1 !== 0 ? 1 : 0;
  return (
    <span ref={ref}>
      {v.toFixed(dec)}
      <span className="text-accent">{suffix}</span>
    </span>
  );
}

export function Stats({ stats }: { stats: { label: string; value: number; suffix: string }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={cn("relative p-6 text-center md:p-10", i % 2 === 0 && "border-r border-border", i < 2 && "border-b border-border md:border-b-0", i === 1 && "md:border-r")}>
          <p className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            <Counter value={Number(s.value)} suffix={s.suffix} />
          </p>
          <p className="mt-2 text-xs font-medium tracking-wide text-muted uppercase md:text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- FAQ ---------------- */
export function FaqAccordion({ items }: { items: { id: number; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-border overflow-hidden rounded-[1.75rem] border border-border bg-card">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id}>
            <button
              onClick={() => setOpen(isOpen ? null : f.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-8 md:py-6"
            >
              <span className="font-display text-base font-semibold md:text-lg">{f.question}</span>
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border border-border transition-all duration-300", isOpen && "rotate-45 border-accent bg-accent text-white")}>
                <Plus className="size-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted md:px-8 md:text-base">{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Portfolio filter ---------------- */
export function PortfolioGrid({ projects }: { projects: ProjectT[] }) {
  const cats = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? projects : projects.filter((p) => p.category === cat);
  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn("relative rounded-full px-4 py-2 text-sm font-medium transition", cat === c ? "text-background" : "border border-border bg-card text-muted hover:text-foreground")}
          >
            {cat === c && <motion.span layoutId="pf-pill" className="absolute inset-0 -z-0 rounded-full bg-foreground" />}
            <span className="relative">{c} <span className="opacity-60">({c === "All" ? projects.length : projects.filter((p) => p.category === c).length})</span></span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
              <ProjectCard p={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/* ---------------- Image gallery w/ lightbox ---------------- */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  useEffect(() => {
    if (idx === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") setIdx((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setIdx((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [idx, images.length]);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((src, i) => (
          <button key={src} onClick={() => setIdx(i)} className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} screenshot ${i + 1}`} loading="lazy" className="size-full object-cover object-top transition duration-700 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {idx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIdx(null)} className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img key={idx} initial={{ scale: 0.95 }} animate={{ scale: 1 }} src={images[idx]} alt="" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <p className="absolute bottom-6 text-sm text-white/70">{idx + 1} / {images.length} · Esc to close · ← → to navigate</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
