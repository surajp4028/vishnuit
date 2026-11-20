import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Banknote, CreditCard, Mail, MapPin, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaPinterestP, FaWhatsapp, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { PAGE_KEYS, PAGE_TITLES, type Store } from "@/lib/server/catalog";

const colHead = "text-[10.5px] font-semibold tracking-[3.5px] text-white/35";
const linkCls = "group inline-flex items-center gap-1 text-[14px] text-white/65 transition hover:text-white";

/** Dark luxury store footer. Policy links appear only when the merchant turns that page on. */
export function StoreFooter({ store, base, logo, categories = [] }: { store: Store; base: string; logo: string | null; categories?: { name: string; slug: string }[] }) {
  const c = store.contact;
  const policies = PAGE_KEYS.filter((k) => store.pages[k]?.on);
  const year = new Date().getFullYear();
  const mark = store.name.trim().split(/\s+/).slice(0, 2).join(" ");
  const pay = [
    store.payments.cod && { icon: Banknote, t: "Cash on delivery" },
    (store.payments.upi.on || store.payments.razorpay.on) && { icon: Smartphone, t: "UPI" },
    store.payments.razorpay.on && { icon: CreditCard, t: "Cards & netbanking" },
  ].filter(Boolean) as { icon: typeof Banknote; t: string }[];
  const socials = [
    c.whatsapp && { href: `https://wa.me/${c.whatsapp}`, icon: FaWhatsapp, label: "WhatsApp" },
    c.instagram && { href: c.instagram, icon: FaInstagram, label: "Instagram" },
    c.facebook && { href: c.facebook, icon: FaFacebookF, label: "Facebook" },
    c.youtube && { href: c.youtube, icon: FaYoutube, label: "YouTube" },
    c.pinterest && { href: c.pinterest, icon: FaPinterestP, label: "Pinterest" },
    c.x && { href: c.x, icon: FaXTwitter, label: "X" },
  ].filter(Boolean) as { href: string; icon: typeof FaWhatsapp; label: string }[];

  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-[#06070b] text-white">
      {/* soft glow + hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.13),transparent)]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* brand statement */}
        <div className="flex flex-col gap-8 border-b border-white/[.07] py-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo && <img src={logo} alt={store.name} className="mb-6 h-11 w-auto max-w-[170px] rounded-xl bg-white p-1.5 object-contain" />}
            <p className="font-display text-[1.7rem] leading-[1.1] font-extrabold tracking-tight sm:text-[2.6rem]">
              <span className="bg-gradient-to-br from-white via-white to-white/45 bg-clip-text text-transparent">{store.tagline || `Thoughtfully made. Delivered to you.`}</span>
            </p>
            <p className="mt-4 text-sm text-white/45">— {store.name}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`${base}/shop`} className="inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-[13px] font-bold tracking-wide text-black uppercase transition hover:gap-3">Shop now <ArrowUpRight className="size-4" /></Link>
            {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-pill border border-white/15 px-6 py-3 text-[13px] font-bold tracking-wide uppercase transition hover:border-white/40"><FaWhatsapp className="size-4" /> Chat with us</a>}
          </div>
        </div>

        {/* columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 md:grid-cols-4">
          <div>
            <p className={colHead}>SHOP</p>
            <ul className="mt-5 space-y-3">
              <li><Link href={`${base}/shop`} className={linkCls}>All products</Link></li>
              {categories.slice(0, 5).map((x) => <li key={x.slug}><Link href={`${base}/shop?c=${x.slug}`} className={linkCls}>{x.name}</Link></li>)}
              <li><Link href={`${base}/shop?sort=off`} className={linkCls}>Offers</Link></li>
            </ul>
          </div>
          <div>
            <p className={colHead}>HELP</p>
            <ul className="mt-5 space-y-3">
              <li><Link href={`${base}/about`} className={linkCls}>Our story</Link></li>
              <li><Link href={`${base}/contact`} className={linkCls}>Contact us</Link></li>
              <li><Link href={`${base}/cart`} className={linkCls}>Your bag</Link></li>
              {policies.map((k) => <li key={k}><Link href={`${base}/policy/${k}`} className={linkCls}>{PAGE_TITLES[k]}</Link></li>)}
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className={colHead}>CONTACT</p>
            <ul className="mt-5 space-y-3.5 text-[14px] text-white/65">
              {c.phone && <li><a href={`tel:${c.phone}`} className="flex items-start gap-3 transition hover:text-white"><Phone className="mt-0.5 size-4 shrink-0 text-white/30" />{c.phone}</a></li>}
              {c.email && <li><a href={`mailto:${c.email}`} className="flex items-start gap-3 break-all transition hover:text-white"><Mail className="mt-0.5 size-4 shrink-0 text-white/30" />{c.email}</a></li>}
              {c.address && <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-white/30" /><span className="whitespace-pre-line">{c.address}</span></li>}
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            {socials.length > 0 && (
              <>
                <p className={colHead}>FOLLOW</p>
                <div className="mt-5 flex gap-2.5">
                  {socials.map((x) => <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label} className="grid size-11 place-items-center rounded-full bg-white/[.06] text-white/75 ring-1 ring-white/10 transition hover:bg-white hover:text-black"><x.icon className="size-4" /></a>)}
                </div>
              </>
            )}
            {pay.length > 0 && (
              <>
                <p className={`${colHead} ${socials.length ? "mt-9" : ""}`}>WE ACCEPT</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pay.map((x) => <span key={x.t} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-[11.5px] font-medium text-white/70"><x.icon className="size-3.5 text-white/45" />{x.t}</span>)}
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-white/40"><ShieldCheck className="size-3.5" /> Secure checkout</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* oversized wordmark: up to 2 words, caps, sized to fit the width */}
      <div aria-hidden className="pointer-events-none overflow-hidden px-4 pt-4 pb-6 text-center select-none sm:pb-8">
        <span className="inline-block bg-gradient-to-b from-white/[.16] to-white/[.02] bg-clip-text font-display leading-none font-extrabold tracking-tight whitespace-nowrap text-transparent uppercase" style={{ fontSize: `min(15vw, ${(128 / Math.max(mark.length, 4)).toFixed(2)}vw, 10rem)` }}>
          {mark}
        </span>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/[.07]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 pt-6 pb-28 text-xs text-white/40 sm:flex-row sm:px-8 sm:pr-24 sm:pb-6 2xl:pr-8">
          <p>© {year} {store.name}. All rights reserved.</p>
          <a href="https://www.vishnuit.co.in" target="_blank" rel="noopener" className="group inline-flex items-center gap-2.5 rounded-pill border border-white/10 bg-white/[.03] py-1.5 pr-3 pl-4 transition hover:border-white/25">
            <span className="text-[11px] tracking-wide text-white/50 transition group-hover:text-white/80">Designed by</span>
            <Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT Solutions" width={78} height={30} className="h-5 w-auto opacity-80 transition group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}
