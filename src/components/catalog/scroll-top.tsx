"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Next scrolls to where the page content starts (below the sticky bar + header). Open every store page at the very top instead. */
export function ScrollTop() {
  const path = usePathname();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [path]);
  return null;
}
