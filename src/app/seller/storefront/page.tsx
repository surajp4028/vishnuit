import { storeForOwner } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { StorefrontEditor, type Front, type Reviews } from "@/components/seller/storefront";

export const metadata = { title: "Storefront" };

export default async function SellerStorefront({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { store, cfg } = await requireSeller();
  const { tab } = await searchParams;
  const o = storeForOwner(store, cfg.plans);
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Storefront</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Design what shoppers see — banners, offers bar, highlights, reviews and map.</p>
      <StorefrontEditor initial={JSON.parse(JSON.stringify(o.storefront)) as Front} address={store.contact.address ?? ""} handle={store.handle} reviews={JSON.parse(JSON.stringify(store.testimonials)) as Reviews} initialTab={tab} about={store.about ?? ""} />
    </div>
  );
}
