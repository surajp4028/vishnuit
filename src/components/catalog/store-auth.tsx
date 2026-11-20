import Link from "next/link";
import { BadgeCheck, Package, Truck } from "lucide-react";

/** Store-branded auth shell: split card with the store's promise on the left (desktop). */
export function StoreAuthShell({ store, base, logo, title, subtitle, children }: { store: string; base: string; logo: string | null; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-3 pt-6 pb-10 sm:px-6 sm:pt-12">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[1fr_1.1fr]">
        <div className="relative isolate hidden flex-col justify-between bg-[#0b0d12] p-10 text-white md:flex">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,.22),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(59,130,246,.2),transparent_55%)]" />
          <Link href={base} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt={store} className="h-10 w-auto max-w-[150px] rounded-lg bg-white p-1 object-contain" /> : <span className="font-display text-2xl font-extrabold">{store}</span>}
          </Link>
          <div>
            <p className="font-display text-3xl leading-tight font-extrabold tracking-tight">Your orders, saved in one place.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              <li className="flex items-center gap-3"><Truck className="size-4 text-amber-300" /> Track every order live</li>
              <li className="flex items-center gap-3"><Package className="size-4 text-amber-300" /> Re-order your favourites fast</li>
              <li className="flex items-center gap-3"><BadgeCheck className="size-4 text-amber-300" /> Download invoices anytime</li>
            </ul>
          </div>
          <p className="text-xs text-white/40">Secure login · powered by Vishnu IT</p>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="font-display text-[1.9rem] leading-tight font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </section>
  );
}
