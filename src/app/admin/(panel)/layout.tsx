import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/server/auth";
import { AdminShell } from "@/components/admin/shell";
import { query } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Admin" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [r] = await query<{ c: number }>("SELECT COUNT(*) c FROM leads WHERE status='new'").catch(() => [{ c: 0 }]);
  return <AdminShell admin={admin} newLeads={Number(r?.c ?? 0)}>{children}</AdminShell>;
}
