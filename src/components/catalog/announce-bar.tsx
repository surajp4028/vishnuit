import { Sparkle } from "lucide-react";

/** Black offers strip above the store header. One message sits still; several scroll and pause on hover. */
export function AnnounceBar({ items }: { items: string[] }) {
  if (!items.length) return null;
  if (items.length === 1) {
    return <div className="bg-[#0a0b10] px-4 py-2 text-center text-[11.5px] font-semibold tracking-[1.5px] text-white uppercase sm:text-xs">{items[0]}</div>;
  }
  const row = [...items, ...items, ...items];
  return (
    <div className="group overflow-hidden bg-[#0a0b10] py-2 text-white">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="flex shrink-0 items-center">
            {row.map((t, n) => (
              <span key={n} className="flex items-center gap-6 px-6 text-[11.5px] font-semibold tracking-[1.5px] whitespace-nowrap uppercase sm:text-xs">
                {t}<Sparkle className="size-3 fill-amber-300 text-amber-300" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
