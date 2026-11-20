import { requireSeller } from "@/lib/server/seller";
import { getAttributes } from "@/lib/server/attributes";
import { AttributesManager } from "@/components/seller/attributes";

export const metadata = { title: "Attributes" };

export default async function SellerAttributes() {
  const { store } = await requireSeller();
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Attributes</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Save sizes, colours and other options once — pick them in one tap when adding products.</p>
      <AttributesManager initial={await getAttributes(store.id)} />
    </div>
  );
}
