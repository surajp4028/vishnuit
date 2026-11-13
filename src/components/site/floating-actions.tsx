"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";

export function FloatingActions({ whatsapp, show }: { whatsapp: string; show: boolean }) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const on = () => setUp(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      <button
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn("glass grid size-11 place-items-center rounded-full border border-border shadow-lg transition-all", up ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")}
      >
        <ArrowUp className="size-4" />
      </button>
      {show && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Vishnu IT, I'd like to discuss a project.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="group relative flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)] transition hover:scale-105"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.5s]" />
          <FaWhatsapp className="relative size-6" />
        </a>
      )}
    </div>
  );
}
