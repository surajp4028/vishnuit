"use client";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

export function StoreLogout({ base }: { base: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button onClick={async () => { setBusy(true); await fetch("/api/account/logout", { method: "POST" }); window.location.href = base || "/"; }} className="inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 text-xs font-bold">
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />} Log out
    </button>
  );
}
