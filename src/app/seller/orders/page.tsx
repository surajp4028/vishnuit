import { requireSeller, storeOrders } from "@/lib/server/seller";
import { OrdersPage } from "@/components/seller/client-pages";

export const metadata = { title: "Orders" };

export default async function SellerOrders({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const { store } = await requireSeller();
  const [orders, { o }] = await Promise.all([storeOrders(store.id), searchParams]);
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Orders</h1>
      <OrdersPage orders={JSON.parse(JSON.stringify(orders))} openId={o ? Number(o) : undefined} />
    </div>
  );
}
