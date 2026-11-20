import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { PAGE_KEYS, PAGE_TITLES, type Store } from "@/lib/server/catalog";

/** Dark, minimal store footer. Policy links appear only when the merchant turns that page on. */
export function StoreFooter({ store, base, logo }: { store: Store; base: string; logo: string | null }) {
  const c = store.contact;
  const policies = PAGE_KEYS.filter((k) => store.pages[k]?.on);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-[#07090f] text-white">
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-28 sm:px-6 sm:pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt={store.name} className="h-12 w-auto max-w-[180px] rounded-lg bg-white/95 object-contain p-1.5" /> : <p className="font-display text-2xl font-extrabold tracking-tight">{store.name}</p>}
            {store.tagline && <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">{store.tagline}</p>}
            <div className="mt-6 flex gap-2.5">
              {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/40 hover:text-white"><FaWhatsapp className="size-4" /></a>}
              {c.instagram && <a href={c.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/40 hover:text-white"><FaInstagram className="size-4" /></a>}
              {c.facebook && <a href={c.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/40 hover:text-white"><FaFacebookF className="size-4" /></a>}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[3px] text-white/40">EXPLORE</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {[["", "Home"], ["/shop", "Shop all"], ["/about", "About us"], ["/contact", "Contact"]].map(([h, l]) => <li key={l}><Link href={base + h} className="transition hover:text-white">{l}</Link></li>)}
              {policies.map((k) => <li key={k}><Link href={`${base}/policy/${k}`} className="transition hover:text-white">{PAGE_TITLES[k]}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[3px] text-white/40">GET IN TOUCH</p>
            <ul className="mt-5 space-y-3.5 text-sm text-white/70">
              {c.phone && <li><a href={`tel:${c.phone}`} className="flex items-start gap-3 hover:text-white"><Phone className="mt-0.5 size-4 shrink-0 text-white/40" />{c.phone}</a></li>}
              {c.email && <li><a href={`mailto:${c.email}`} className="flex items-start gap-3 break-all hover:text-white"><Mail className="mt-0.5 size-4 shrink-0 text-white/40" />{c.email}</a></li>}
              {c.address && <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-white/40" /><span className="whitespace-pre-line">{c.address}</span></li>}
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[.08] pt-7 text-xs text-white/40 sm:flex-row">
          <p>© {year} {store.name}. All rights reserved.</p>
          <a href="https://www.vishnuit.co.in" target="_blank" rel="noopener" className="group inline-flex items-center gap-2 transition hover:text-white/80">
            <span>Designed by</span>
            <Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT Solutions" width={78} height={30} className="h-5 w-auto opacity-70 transition group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}
