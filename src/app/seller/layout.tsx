import type { Metadata } from "next";
import { queryOne } from "@/lib/server/db";
import { imgUrl } from "@/lib/server/catalog";
import { publicUser } from "@/lib/server/users";
import { requireSeller } from "@/lib/server/seller";
import { SellerShell } from "@/components/seller/shell";

export const metadata: Metadata = { title: { default: "Seller panel", template: "%s · Seller panel" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, store, cfg } = await requireSeller();
  const n = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_orders WHERE store_id=? AND status='new'", [store.id]);
  const { effectivePlan } = await import("@/lib/server/catalog");
  const pu = publicUser(user);
  return (
    <SellerShell
      store={{ name: store.name, handle: store.handle, uid: store.code, logo: imgUrl(store.logo_key), planName: cfg.plans[effectivePlan(store)].name }}
      user={{ name: pu.name || pu.email || "", avatar: pu.avatar }}
      newOrders={Number(n?.n ?? 0)}
    >
      {children}
    </SellerShell>
  );
}
