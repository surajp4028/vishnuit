import { effectivePlan } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { DomainManager } from "@/components/seller/domain";

export const metadata = { title: "Domain" };

export default async function SellerDomain() {
  const { store } = await requireSeller();
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Your domain</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Open your store on your own address, like <b className="text-foreground">yourbrand.com</b>.</p>
      <DomainManager handle={store.handle} initial={store.domain} paid={effectivePlan(store) !== "free"} />
    </div>
  );
}
