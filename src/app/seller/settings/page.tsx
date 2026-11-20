import { storeForOwner } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { SettingsPage } from "@/components/seller/client-pages";

export const metadata = { title: "Settings" };

export default async function SellerSettings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { store, cfg } = await requireSeller();
  const { tab } = await searchParams;
  const t = tab === "payments" || tab === "pages" || tab === "tax" || tab === "reviews" || tab === "delivery" ? tab : "profile";
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Settings</h1>
      <SettingsPage store={JSON.parse(JSON.stringify(storeForOwner(store, cfg.plans)))} initialTab={t} />
    </div>
  );
}
