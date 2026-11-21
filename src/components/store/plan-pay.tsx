"use client";
import { PlanSheet } from "./plan-sheet";

type PlanKey = "free" | "starter" | "growth" | "premium";
type PlanDef = { name: string; limit: number | null; price: number; razorpay: boolean; storageMb?: number };

/** The plan picker + Razorpay, shown as a card on the payment page (no popup). */
export function PlanPay(props: { plans: Record<PlanKey, PlanDef>; current: PlanKey; storePlan: PlanKey; expiresAt: string | null; returnUrl: string }) {
  return <PlanSheet {...props} inline onClose={() => (window.location.href = props.returnUrl)} />;
}
