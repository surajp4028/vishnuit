import { query } from "@/lib/server/db";
import { PaymentsTable, type PaymentRow } from "@/components/admin/payments-table";

export const metadata = { title: "Payments & Clients" };

export default async function PaymentsPage() {
  const rows = await query<PaymentRow>(
    "SELECT id,plan_name,amount,name,email,phone,company,notes,rzp_order_id,rzp_payment_id,method,status,project_status,created_at,paid_at FROM payments ORDER BY id DESC LIMIT 1000",
  );
  return <PaymentsTable initial={rows.map((r) => ({ ...r, amount: Number(r.amount) }))} testMode={(process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_")} />;
}
