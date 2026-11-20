import { googleLoginOn } from "@/lib/server/content";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard, RegisterForm } from "@/components/account/auth-forms";
import { getUser } from "@/lib/server/users";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getUser()) redirect("/account");
  return (
    <AuthCard title="Create your account" subtitle="One account for your payments, invoices and your own online store.">
      <Suspense><RegisterForm google={await googleLoginOn()} /></Suspense>
    </AuthCard>
  );
}
