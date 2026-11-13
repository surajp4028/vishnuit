import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow, title, highlight, subtitle, align = "center", className,
}: { eyebrow?: string; title: string; highlight?: string; subtitle?: string; align?: "center" | "left"; className?: string }) {
  return (
    <div className={cn("mb-12 max-w-3xl md:mb-16", align === "center" ? "mx-auto text-center" : "", className)}>
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
          <span className="size-1.5 rounded-full bg-accent" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
        {title} {highlight && <span className="font-serif font-normal italic text-gradient">{highlight}</span>}
      </h2>
      {subtitle && <p className="mt-4 text-base text-pretty text-muted md:text-lg">{subtitle}</p>}
    </div>
  );
}
