import type { Metadata } from "next";
import { query } from "@/lib/server/db";
import { publicUser, requireUser } from "@/lib/server/users";
import { orderInvoicePath } from "@/lib/server/invoice";
import { getCatalogConfig, getStoreForUser } from "@/lib/server/catalog";
import { AccountDashboard, type AccountPayment } from "@/components/account/dashboard";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser("/account");
  const [{ tab }, store, cfg] = await Promise.all([searchParams, getStoreForUser(u.id), getCatalogConfig()]);
  const myOrders = await query<Record<string, unknown>>(
    "SELECT o.order_no, o.items, o.subtotal, o.status, o.pay_method, o.pay_status, o.created_at, o.status_log, o.tracking, s.name store_name, s.handle FROM store_orders o JOIN stores s ON s.id=o.store_id WHERE o.customer_id=? ORDER BY o.id DESC LIMIT 200",
    [u.id],
  );
  const rows = await query<AccountPayment>(
    "SELECT plan_id, plan_name, amount, status, method, rzp_order_id, rzp_payment_id, created_at, paid_at FROM payments WHERE user_id=? ORDER BY id DESC LIMIT 200",
    [u.id],
  );
  return (
    <AccountDashboard
      user={publicUser(u)}
      memberSince={String(u.created_at)}
      payments={rows.map((r) => ({ ...r, amount: Number(r.amount), created_at: String(r.created_at), paid_at: r.paid_at ? String(r.paid_at) : null }))}
      showStoreCard={cfg.features.accountCard && (!!store || cfg.features.newStores)}
      showStoreTab={cfg.features.accountTab && (!!store || cfg.features.newStores)}
      store={store ? { name: store.name, handle: store.handle } : null}
      orders={myOrders.map((o) => ({
        order_no: String(o.order_no), store: String(o.store_name), handle: String(o.handle), subtotal: Number(o.subtotal), status: String(o.status),
        pay_method: String(o.pay_method), pay_status: String(o.pay_status), created_at: String(o.created_at),
        items: (typeof o.items === "string" ? JSON.parse(o.items) : o.items) as { name: string; variant: string | null; qty: number }[],
        invoice: orderInvoicePath(String(o.order_no)),
        status_log: (typeof o.status_log === "string" ? JSON.parse(o.status_log) : o.status_log ?? []) as { s: string; at: string }[],
        tracking: (typeof o.tracking === "string" ? JSON.parse(o.tracking) : o.tracking ?? null) as { courier: string; number: string; url: string } | null,
      }))}
      initialTab={tab === "payments" || tab === "profile" || tab === "orders" ? tab : "overview"}
    />
  );
}
