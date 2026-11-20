"use client";
import Link from "next/link";
import { PayNowButton } from "./pay-now";
import { UserMenu } from "./user-menu";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/icon";

type NavService = { slug: string; title: string; category: string; icon: string; short: string };
/** Our own products (SaaS). Add future ones here — they appear under "Our products" in the Services menu. */
const PRODUCTS = [
  { href: "/online-store", title: "Online Store", desc: "Your own catalogue, COD & UPI orders, GST invoices", icon: Store, badge: "NEW" },
];

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services", mega: true },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ logoLight, logoDark, name, services, ctaHref = "/contact", ctaLabel = "Get a quote", payNow }: { logoLight: string; logoDark: string; name: string; services: NavService[]; ctaHref?: string; ctaLabel?: string; payNow?: { desktop: boolean; mobile: boolean } }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));
  useEffect(() => {
    setOpen(false);
    setMega(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const cats = ["Development", "Design", "Digital Marketing", "SEO"];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:pt-4">
      <motion.nav
        animate={{ width: scrolled ? "min(1100px, 100%)" : "min(1280px, 100%)", y: scrolled ? 0 : 4 }}
        transition={{ type: "spring", stiffness: 220, damping: 30 }}
        onMouseLeave={() => setMega(false)}
        className={cn(
          "relative flex items-center justify-between rounded-full border px-3 py-2 transition-[background,box-shadow,border-color] duration-300 md:px-4",
          scrolled || open || mega
            ? "border-border bg-white/[0.97] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:bg-[#0b0f1a]/[0.97]"
            : "border-white/40 bg-white/60 backdrop-blur-md dark:border-white/5 dark:bg-[#0b0f1a]/60",
        )}
      >
        <Link href="/" aria-label={`${name} — home`} className="relative ml-1 h-11 w-[124px] shrink-0">
          <Image src={logoLight} alt={name} fill priority sizes="124px" className="object-contain object-left dark:hidden" />
          <Image src={logoDark} alt={name} fill priority sizes="124px" className="hidden object-contain object-left dark:block" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href} onMouseEnter={() => setMega(!!l.mega)}>
              <Link
                href={l.href}
                className={cn(
                  "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive(l.href) ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {isActive(l.href) && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08]" />
                )}
                {l.label}
                {l.mega && <ChevronDown className={cn("size-3.5 transition-transform", mega && "rotate-180")} />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          {payNow && (payNow.desktop || payNow.mobile) && <PayNowButton desktop={payNow.desktop} mobile={payNow.mobile} />}
          <Link
            href={ctaHref}
            className="group hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 xl:inline-flex"
          >
            {ctaLabel}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full border border-border bg-card/60 lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={open ? "x" : "m"} initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }} className="grid place-items-center">
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute top-[calc(100%+10px)] bg-background left-1/2 hidden w-[min(1200px,96vw)] -translate-x-1/2 rounded-3xl border border-border p-6 shadow-2xl lg:block"
            >
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.15fr)] gap-6">
                {cats.slice(0, 4).map((c) => (
                  <div key={c}>
                    <p className="mb-3 text-xs font-semibold tracking-widest text-accent uppercase">{c}</p>
                    <ul className="space-y-1">
                      {services
                        .filter((s) => s.category === c)
                        .slice(0, 6)
                        .map((s) => (
                          <li key={s.slug}>
                            <Link href={`/services/${s.slug}`} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition hover:bg-foreground/5">
                              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card text-accent">
                                <Icon name={s.icon} className="size-3.5" />
                              </span>
                              <span className="text-foreground/80 group-hover:text-foreground">{s.title}</span>
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
                <div className="rounded-2xl bg-gradient-to-b from-foreground/[.04] to-transparent p-3 ring-1 ring-border">
                  <p className="mb-3 px-1 text-xs font-semibold tracking-widest text-accent uppercase">Our products</p>
                  <ul className="space-y-1.5">
                    {PRODUCTS.map((p) => (
                      <li key={p.href}>
                        <Link href={p.href} onClick={() => setMega(false)} className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-foreground/5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-md"><p.icon className="size-4" /></span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">{p.title}{p.badge && <span className="rounded-full bg-amber-400/20 px-1.5 py-px text-[9px] font-extrabold tracking-wider text-amber-600">{p.badge}</span>}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted">{p.desc}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 px-2 text-[11px] text-muted">More tools coming soon.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-accent/10 via-accent-2/10 to-transparent dark:from-accent/15 px-5 py-4">
                <p className="text-sm text-muted">
                  Not sure what you need? <span className="text-foreground">Get a free consultation & website audit.</span>
                </p>
                <Link href="/services" className="text-sm font-semibold text-accent hover:underline">
                  All services →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile drawer: blurred backdrop + panel springing in from the right, links arriving one by one. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[6px] lg:hidden"
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "105%" }}
              animate={{ x: 0 }}
              exit={{ x: "105%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.4 }}
              onDragEnd={(_, info) => { if (info.offset.x > 90 || info.velocity.x > 500) setOpen(false); }}
              className="fixed inset-y-0 right-0 z-[61] flex w-[88%] max-w-[390px] flex-col overflow-hidden rounded-l-[2rem] border-l border-border bg-background shadow-[-30px_0_80px_-20px_rgba(15,23,42,.35)] lg:hidden"
            >
              {/* soft brand glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(37,99,235,.18),transparent)]" />
              <div className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.16),transparent)]" />

              <div className="relative flex items-center justify-between px-5 pt-5 pb-3">
                <Link href="/" onClick={() => setOpen(false)} aria-label={`${name} — home`} className="relative h-10 w-[112px]">
                  <Image src={logoLight} alt={name} fill sizes="112px" className="object-contain object-left dark:hidden" />
                  <Image src={logoDark} alt={name} fill sizes="112px" className="hidden object-contain object-left dark:block" />
                </Link>
                <motion.button
                  initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 380, damping: 20 }}
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-10 place-items-center rounded-full border border-border bg-card"
                >
                  <X className="size-4" />
                </motion.button>
              </div>

              <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                <motion.ul
                  initial="hide"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
                  className="space-y-1"
                >
                  {LINKS.map((l) => (
                    <motion.li key={l.href} variants={{ hide: { opacity: 0, x: 28 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 28 } } }}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-center justify-between rounded-2xl px-4 py-3 font-display text-[1.35rem] font-bold tracking-tight transition",
                          isActive(l.href) ? "bg-accent/10 text-accent" : "text-foreground/85 hover:bg-foreground/5",
                        )}
                      >
                        {l.label}
                        <ArrowUpRight className={cn("size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isActive(l.href) ? "text-accent" : "text-muted")} />
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.35 }}>
                  <p className="mt-6 mb-2 px-4 text-[11px] font-bold tracking-[3px] text-accent uppercase">Our products</p>
                  <div className="space-y-2">
                    {PRODUCTS.map((p) => (
                      <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 transition active:scale-[.98]">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,.7)]"><p.icon className="size-4" /></span>
                        <span className="min-w-0"><span className="flex items-center gap-1.5 text-sm font-semibold">{p.title}{p.badge && <span className="rounded-full bg-amber-400/20 px-1.5 py-px text-[9px] font-extrabold text-amber-600">{p.badge}</span>}</span><span className="block truncate text-xs text-muted">{p.desc}</span></span>
                      </Link>
                    ))}
                  </div>

                  <p className="mt-6 mb-2 px-4 text-[11px] font-bold tracking-[3px] text-accent uppercase">Popular services</p>
                  <div className="grid grid-cols-2 gap-2">
                    {services.slice(0, 8).map((sv) => (
                      <Link key={sv.slug} href={`/services/${sv.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm transition active:scale-[.98]">
                        <Icon name={sv.icon} className="size-4 shrink-0 text-accent" />
                        <span className="truncate">{sv.title}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 26 }} className="relative border-t border-border bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
                <Link href={ctaHref} onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 font-semibold text-background transition active:scale-[.98]">
                  Get a free quote <ArrowUpRight className="size-4" />
                </Link>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
