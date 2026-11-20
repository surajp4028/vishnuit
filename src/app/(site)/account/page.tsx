import type { Metadata } from "next";
import { query } from "@/lib/server/db";
import { publicUser, requireUser } from "@/lib/server/users";
import { getSettings } from "@/lib/server/content";
import { getStoreForUser } from "@/lib/server/catalog";
import { AccountDashboard, type AccountPayment } from "@/components/account/dashboard";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser("/account");
  const [{ tab }, settings, store] = await Promise.all([searchParams, getSettings(), getStoreForUser(u.id)]);
  const rows = await query<AccountPayment>(
    "SELECT plan_id, plan_name, amount, status, method, rzp_order_id, rzp_payment_id, created_at, paid_at FROM payments WHERE user_id=? ORDER BY id DESC LIMIT 200",
    [u.id],
  );
  return (
    <AccountDashboard
      user={publicUser(u)}
      memberSince={String(u.created_at)}
      payments={rows.map((r) => ({ ...r, amount: Number(r.amount), created_at: String(r.created_at), paid_at: r.paid_at ? String(r.paid_at) : null }))}
      showStoreCard={settings.conversion.storeCardOnAccount}
      store={store ? { name: store.name, handle: store.handle } : null}
      initialTab={tab === "payments" || tab === "profile" ? tab : "overview"}
    />
  );
}
