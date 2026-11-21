"use client";
import { useState } from "react";
import { PlanSheet } from "@/components/store/plan-sheet";

type PlanKey = "free" | "starter" | "growth" | "premium";
export function UpgradeButton({ plans, current, label, storePlan, expiresAt, payUrl }: { plans: Record<PlanKey, { name: string; limit: number | null; price: number; razorpay: boolean; storageMb?: number }>; current: PlanKey; label: string; storePlan?: PlanKey; expiresAt?: string | null; payUrl?: string }) {
  const [open, setOpen] = useState(false);
  // Stores on their own domain pay on vishnuit.co.in's payment page (Razorpay only accepts our registered site).
  if (payUrl) return <a href={payUrl} className="inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-black">{label}</a>;
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black">{label}</button>
      {open && <PlanSheet plans={plans} current={current} storePlan={storePlan ?? current} expiresAt={expiresAt ?? null} onClose={() => setOpen(false)} />}
    </>
  );
}
