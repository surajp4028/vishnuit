"use client";
import { Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

const scrollToForm = () => {
  const el = document.getElementById("get-quote");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.location.href = "/website-development#get-quote";
};

export function LpStickyBar({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 gap-2 border-t border-border bg-white/95 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden dark:bg-[#05070d]/95">
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-bold"><Phone className="size-4 text-[#1d4ed8]" /> Call</a>
      <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Vishnu IT, I want a website. Please share details.")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white"><FaWhatsapp className="size-4" /> WhatsApp</a>
      <button onClick={scrollToForm} className="rounded-xl bg-gradient-to-r from-[#d4a017] to-[#f5c542] py-3 text-sm font-extrabold text-[#0a0f1f]">Get Quote</button>
    </div>
  );
}

export function ScrollToFormButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button onClick={scrollToForm} className={className}>{children}</button>;
}
