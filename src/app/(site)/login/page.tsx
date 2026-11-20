import { googleLoginOn } from "@/lib/server/content";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard, LoginForm } from "@/components/account/auth-forms";
import { getUser } from "@/lib/server/users";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUser()) redirect("/account");
  return (
    <AuthCard title="Welcome back" subtitle="Log in to see your payments, invoices and online store.">
      <Suspense><LoginForm google={await googleLoginOn()} /></Suspense>
    </AuthCard>
  );
}
