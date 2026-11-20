import { getStoreCategories, getStoreProducts } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { ProductsPage } from "@/components/seller/client-pages";
import { effectivePlan } from "@/lib/server/catalog";
import { getAttributes } from "@/lib/server/attributes";

export const metadata = { title: "Products" };

export default async function SellerProducts() {
  const { store, cfg } = await requireSeller();
  const [products, categories, attributes] = await Promise.all([getStoreProducts(store.id), getStoreCategories(store.id), getAttributes(store.id)]);
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Products</h1>
      <ProductsPage products={JSON.parse(JSON.stringify(products))} categories={JSON.parse(JSON.stringify(categories))} limit={cfg.plans[effectivePlan(store)].limit} handle={store.handle} attributes={attributes} />
    </div>
  );
}
