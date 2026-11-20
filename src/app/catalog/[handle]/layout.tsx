import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStoreByHandle, getStoreCategories, imgUrl } from "@/lib/server/catalog";
import { CartProvider } from "@/components/catalog/cart";
import { StoreHeader, WhatsAppFloat } from "@/components/catalog/chrome";
import { StoreFooter } from "@/components/catalog/footer";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const s = await getStoreByHandle((await params).handle);
  if (!s) return { title: "Store not found" };
  const logo = imgUrl(s.logo_key);
  return {
    title: { absolute: s.name, template: `%s · ${s.name}` },
    description: s.tagline || `Shop ${s.name} online.`,
    openGraph: { title: s.name, description: s.tagline || undefined, images: imgUrl(s.banner_key) || logo ? [imgUrl(s.banner_key) || logo!] : undefined },
    alternates: { canonical: `/catalog/@${s.handle}` },
  };
}

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const logo = imgUrl(s.logo_key);
  const cats = (await getStoreCategories(s.id)).map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <CartProvider handle={s.handle}>
      <div className="min-h-dvh bg-background text-foreground">
        <Suspense fallback={<div className="h-14 border-b border-border sm:h-16" />}><StoreHeader base={base} name={s.name} logo={logo} categories={cats} /></Suspense>
        <main>{children}</main>
        <StoreFooter store={s} base={base} logo={logo} categories={cats} />
        <WhatsAppFloat number={s.contact.whatsapp ?? ""} store={s.name} />
      </div>
    </CartProvider>
  );
}
