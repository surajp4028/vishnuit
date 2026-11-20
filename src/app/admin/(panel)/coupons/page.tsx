import { query } from "@/lib/server/db";
import { CouponsManager, type CouponRow } from "@/components/admin/coupons-manager";

export const metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const rows = await query<CouponRow>(
    "SELECT c.*, u.uid user_uid, u.name user_name FROM coupons c LEFT JOIN users u ON u.id=c.user_id ORDER BY c.id DESC LIMIT 500",
  );
  return <CouponsManager rows={JSON.parse(JSON.stringify(rows))} />;
}
