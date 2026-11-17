"use client";
import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#0a0f1f] px-5 py-2.5 text-sm font-semibold text-white">
      <Download className="size-4" /> Download PDF
    </button>
  );
}
