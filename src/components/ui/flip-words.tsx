"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Rotating words (Aceternity-style).
 * Note: `className` is applied to each animated word span — NOT to a wrapper — because
 * iOS Safari won't paint `background-clip: text` gradients through transformed/blurred
 * child layers (text turns invisible). Each word carries its own gradient instead.
 */
export const FlipWords = ({ words, duration = 3000, className }: { words: string[]; duration?: number; className?: string }) => {
  const list = words.filter((w) => w && w.trim());
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(list.length, 1));
    setIsAnimating(true);
  }, [list.length]);

  useEffect(() => {
    if (isAnimating || list.length < 2) return;
    const t = setTimeout(next, duration);
    return () => clearTimeout(t);
  }, [isAnimating, duration, next, list.length]);

  const current = list[index] ?? "";

  return (
    <span className="relative inline-block">
      <AnimatePresence initial={false} mode="popLayout" onExitComplete={() => setIsAnimating(false)}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn("inline-block whitespace-nowrap pr-[0.08em]", className)}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
