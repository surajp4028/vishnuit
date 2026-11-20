import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { effectivePlan, getCatalogConfig, getStoreByHandle, imgUrl } from "@/lib/server/catalog";
import { Checkout } from "@/components/catalog/checkout";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };
export const revalidate = 120;

export default async function CartPage({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const rzp = s.payments.razorpay.on && !!s.payments.razorpay.key_id && !!s.payments.razorpay.secret_enc && (await getCatalogConfig()).plans[effectivePlan(s)].razorpay;
  return (
    <Checkout
      handle={s.handle}
      base={`/catalog/@${s.handle}`}
      storeName={s.name}
      pay={{ cod: s.payments.cod, upi: s.payments.upi.on, vpa: s.payments.upi.vpa, qr: imgUrl(s.payments.upi.qr_key), razorpay: rzp }}
      rules={{ ...s.storefront.shipping, closed: s.storefront.closed.on ? s.storefront.closed.message || "This store isn't taking orders right now." : "", gstRate: s.tax.gstin ? s.tax.rate : 0, gstOn: Boolean(s.tax.gstin), inclusive: s.tax.inclusive }}
    />
  );
}
