import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/server/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.16),transparent)] blur-2xl" />
      <LoginForm />
    </main>
  );
}
