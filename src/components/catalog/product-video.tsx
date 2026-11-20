"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product video with our own small controls: play/pause and sound on/off. Starts muted (browsers only autoplay muted). */
export function ProductVideo({ src, className, autoPlay = true, startMuted = true }: { src: string; className?: string; autoPlay?: boolean; startMuted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(startMuted);
  const [progress, setProgress] = useState(0);

  // Only play while it's on screen (saves data on phones).
  useEffect(() => {
    const v = ref.current;
    if (!v || !autoPlay) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => setPlaying(false)); else v.pause(); }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, [autoPlay]);

  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };
  const btn = "grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75";
  return (
    <div className={cn("group relative overflow-hidden bg-black", className)}>
      <video
        ref={ref} src={src} muted={muted} loop playsInline autoPlay={autoPlay} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }}
        onClick={toggle} className="size-full cursor-pointer object-cover"
      />
      {!playing && <button type="button" onClick={toggle} aria-label="Play video" className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur"><Play className="ml-0.5 size-5 fill-current" /></button>}
      <div className="absolute right-2.5 bottom-3.5 flex gap-1.5">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className={btn}>{playing ? <Pause className="size-3 fill-current" /> : <Play className="ml-0.5 size-3 fill-current" />}</button>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Sound on" : "Mute"} className={btn}>{muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}</button>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full bg-white transition-[width] duration-200" style={{ width: `${progress * 100}%` }} /></div>
    </div>
  );
}

/** Small ▶ badge on a product card; tap opens the video in a popup (with sound, since the tap allows it). */
export function VideoBadge({ src, name }: { src: string; name: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [open]);
  return (
    <>
      <button
        type="button" aria-label={`Play video of ${name}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="absolute top-2.5 right-2.5 z-10 grid size-8 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition hover:scale-110 hover:bg-black/75"
      >
        <Play className="ml-0.5 size-3.5 fill-current" />
      </button>
      {open && createPortal(
        // The popup is portalled, but React events still bubble to the card's <Link> — stop them so a tap here never opens the product.
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); }} role="dialog" aria-modal="true" aria-label={`${name} video`}>
          <div className="relative w-full max-w-[420px]" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
            <ProductVideo src={src} startMuted={false} className="aspect-[9/16] max-h-[85dvh] w-full rounded-2xl" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-white text-black shadow-xl"><X className="size-5" /></button>
            <p className="mt-3 truncate text-center text-sm font-semibold text-white">{name}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
