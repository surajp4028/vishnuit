"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "relative grid size-9 place-items-center rounded-full border border-border bg-card/60 text-foreground transition hover:scale-105 hover:border-accent/50",
        className,
      )}
    >
      <Sun className={cn("size-4 transition-all", dark ? "scale-0 rotate-90" : "scale-100 rotate-0")} />
      <Moon className={cn("absolute size-4 transition-all", dark ? "scale-100 rotate-0" : "scale-0 -rotate-90")} />
    </button>
  );
}
