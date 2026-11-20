import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStoreByHandle, getStoreCategories, imgUrl } from "@/lib/server/catalog";
import { CartProvider } from "@/components/catalog/cart";
import { StoreHeader, WhatsAppFloat } from "@/components/catalog/chrome";
import { StoreFooter } from "@/components/catalog/footer";
import { AnnounceBar } from "@/components/catalog/announce-bar";
import { ScrollTop } from "@/components/catalog/scroll-top";
import { StorePixels } from "@/components/catalog/store-pixels";
import { flattenTree } from "@/lib/category-tree";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const s = await getStoreByHandle((await params).handle);
  if (!s) return { title: "Store not found" };
  const icon = imgUrl(s.storefront.favicon || s.logo_key);
  const description = s.tagline || (s.about ? s.about.slice(0, 160) : `Shop ${s.name} online — cash on delivery and easy returns.`);
  return {
    title: { absolute: s.name, template: `%s · ${s.name}` },
    description,
    icons: icon ? { icon: [{ url: icon }], apple: [{ url: icon }] } : undefined,
    openGraph: { type: "website", siteName: s.name, title: s.name, description, url: `/catalog/@${s.handle}` },
    twitter: { card: "summary_large_image", title: s.name, description },
    alternates: { canonical: `/catalog/@${s.handle}` },
  };
}

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const logo = imgUrl(s.logo_key);
  const all = flattenTree(await getStoreCategories(s.id));
  const cats = all.filter((c) => c.depth === 0).map((c) => ({ name: c.name, slug: c.slug, children: all.filter((k) => k.parent_id === c.id).map((k) => ({ name: k.name, slug: k.slug })) }));
  return (
    <CartProvider handle={s.handle}>
      <div data-look={s.storefront.look} className="min-h-dvh bg-background text-foreground">
        <ScrollTop />
        <StorePixels meta={s.storefront.pixels.meta} ga={s.storefront.pixels.ga} />
        {s.storefront.closed.on && <div className="bg-amber-400 px-4 py-2 text-center text-[12.5px] font-semibold text-black">{s.storefront.closed.message || "We're taking a short break — you can browse, and orders open again soon."}</div>}
        {s.storefront.bar.on && <AnnounceBar items={s.storefront.bar.items} />}
        <Suspense fallback={<div className="h-14 border-b border-border sm:h-16" />}><StoreHeader base={base} name={s.name} logo={logo} categories={cats} /></Suspense>
        <main>{children}</main>
        <StoreFooter store={s} base={base} logo={logo} categories={cats} />
        <WhatsAppFloat number={s.contact.whatsapp ?? ""} store={s.name} />
      </div>
    </CartProvider>
  );
}
