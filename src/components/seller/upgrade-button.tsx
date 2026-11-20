"use client";
import { useState } from "react";
import { PlanSheet } from "@/components/store/plan-sheet";

type PlanKey = "free" | "starter" | "growth" | "premium";
export function UpgradeButton({ plans, current, label, storePlan, expiresAt }: { plans: Record<PlanKey, { name: string; limit: number | null; price: number; razorpay: boolean; storageMb?: number }>; current: PlanKey; label: string; storePlan?: PlanKey; expiresAt?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black">{label}</button>
      {open && <PlanSheet plans={plans} current={current} storePlan={storePlan ?? current} expiresAt={expiresAt ?? null} onClose={() => setOpen(false)} />}
    </>
  );
}
