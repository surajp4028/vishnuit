import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, ResetForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "New password", robots: { index: false } };

export default function ResetPage() {
  return (
    <AuthCard title="Choose a new password" subtitle="You'll be signed in right after.">
      <Suspense><ResetForm /></Suspense>
    </AuthCard>
  );
}
