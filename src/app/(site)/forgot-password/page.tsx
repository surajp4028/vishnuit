import type { Metadata } from "next";
import { AuthCard, ForgotForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthCard title="Set or reset password" subtitle="Paid us before? Your account already exists — set a password with the email you paid with.">
      <ForgotForm />
    </AuthCard>
  );
}
