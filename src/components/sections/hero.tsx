"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, Play, Star } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { Spotlight } from "@/components/ui/spotlight-new";

type Props = {
  badge: string;
  title: string;
  words: string[];
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  avatars: string[];
  shots: { src: string; title: string; href: string }[];
  announcement?: string;
};

export function Hero(p: Props) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 });

  return (
    <section
      className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      {/* Backgrounds */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(96,165,250,0.16),transparent)]" />
      <div className="pointer-events-none absolute top-40 -right-40 -z-10 size-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.12),transparent)] blur-2xl" />
      <div className="hidden dark:block">
        <Spotlight />
      </div>

      <div className="container-x">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link
              href="/contact"
              className="group mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card/70 py-1 pr-3 pl-1 text-xs shadow-sm backdrop-blur transition hover:border-accent/40 sm:text-sm"
            >
              <span className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] px-2.5 py-0.5 font-semibold text-white">New</span>
              <span className="truncate text-muted group-hover:text-foreground">{p.announcement || p.badge}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl md:text-7xl lg:text-[5.4rem]"
          >
            {p.title}
            <br />
            <span className="relative inline-block min-h-[1.1em]">
              <FlipWords words={p.words} className="!px-0 font-serif font-normal italic text-gradient" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted sm:text-lg md:text-xl"
          >
            {p.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/contact"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(29,78,216,0.55)] transition hover:scale-[1.02] sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {p.primaryCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/70 px-7 py-3.5 text-sm font-semibold backdrop-blur transition hover:border-accent/50 sm:w-auto"
            >
              <Play className="size-3.5 fill-current" /> {p.secondaryCta}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <div className="flex -space-x-2.5">
              {p.avatars.slice(0, 5).map((a, i) => (
                <Image key={a} src={a} alt="" width={36} height={36} className="size-9 rounded-full border-2 border-background object-cover" style={{ zIndex: 10 - i }} />
              ))}
            </div>
            <div className="text-left text-sm">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
                <span className="ml-1.5 font-semibold text-foreground">4.9/5</span>
              </div>
              <p className="text-muted">Trusted by 120+ brands across India & abroad</p>
            </div>
          </motion.div>
        </div>

        {/* Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1600 }}
          className="relative mx-auto mt-16 max-w-6xl md:mt-20"
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative">
            <div className="relative overflow-hidden rounded-[1.25rem] border border-border bg-card p-1.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.45)] md:rounded-[1.75rem] md:p-2.5">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="mx-auto hidden rounded-full bg-foreground/5 px-10 py-1 text-[11px] text-muted sm:block">vishnuit.co.in/portfolio</span>
              </div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl md:rounded-2xl">
                <Image src={p.shots[0].src} alt={p.shots[0].title} fill priority sizes="(max-width: 1200px) 100vw, 1150px" className="object-cover object-top" />
              </div>
            </div>
            {p.shots[1] && (
              <motion.div
                style={{ translateZ: 80 }}
                className="absolute -bottom-8 -left-3 hidden w-[34%] overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-2xl md:block lg:-left-10"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image src={p.shots[1].src} alt={p.shots[1].title} fill sizes="400px" className="object-cover object-top" />
                </div>
                <p className="px-2 pt-2 pb-1 text-xs font-semibold">{p.shots[1].title}</p>
              </motion.div>
            )}
            {p.shots[2] && (
              <motion.div
                style={{ translateZ: 120 }}
                className="absolute -top-8 -right-3 hidden w-[30%] animate-float overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-2xl md:block lg:-right-10"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image src={p.shots[2].src} alt={p.shots[2].title} fill sizes="380px" className="object-cover object-top" />
                </div>
                <p className="px-2 pt-2 pb-1 text-xs font-semibold">{p.shots[2].title}</p>
              </motion.div>
            )}
          </motion.div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
