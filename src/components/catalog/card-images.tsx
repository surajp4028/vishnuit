"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Product card photos: on hover the card plays through its photos (crossfade), with tiny progress bars. */
export function CardImages({ images, alt, dim }: { images: string[]; alt: string; dim?: boolean }) {
  const [i, setI] = useState(0);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => { if (t.current) clearInterval(t.current); t.current = null; setI(0); };
  const start = () => {
    if (images.length < 2 || t.current) return;
    setI(1);
    t.current = setInterval(() => setI((x) => (x + 1) % images.length), 1100);
  };
  useEffect(() => () => { if (t.current) clearInterval(t.current); }, []);
  return (
    <div className="absolute inset-0" onMouseEnter={start} onMouseLeave={stop}>
      {images.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src + k} src={src} alt={k === 0 ? alt : ""} loading={k === 0 ? "lazy" : "lazy"} className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", k === i ? "opacity-100" : "opacity-0", dim && "opacity-60 grayscale")} />
      ))}
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {images.map((_, k) => <span key={k} className={cn("h-[3px] flex-1 rounded-full", k === i ? "bg-white" : "bg-white/45")} />)}
        </div>
      )}
    </div>
  );
}
