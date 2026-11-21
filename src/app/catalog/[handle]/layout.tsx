import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStoreByHandle, isTestStore, getStoreCategories, getStoreProducts, imgUrl, storeBase, storeAbsUrl } from "@/lib/server/catalog";
import { CartProvider } from "@/components/catalog/cart";
import { StoreHeader, WhatsAppFloat } from "@/components/catalog/chrome";
import { StoreFooter } from "@/components/catalog/footer";
import { AnnounceBar } from "@/components/catalog/announce-bar";
import { ScrollTop } from "@/components/catalog/scroll-top";
import { StorePixels } from "@/components/catalog/store-pixels";
import { flattenTree, withChildren } from "@/lib/category-tree";
import type { MenuPick } from "@/components/catalog/chrome";

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
    openGraph: { type: "website", siteName: s.name, title: s.name, description, url: storeAbsUrl(s) },
    twitter: { card: "summary_large_image", title: s.name, description },
    alternates: { canonical: storeAbsUrl(s) },
    ...(isTestStore(s.handle) ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ handle: string }> }) {
  const raw = (await params).handle;
  const s = await getStoreByHandle(raw);
  if (!s) notFound();
  const base = storeBase(raw, s.handle);
  const logo = imgUrl(s.logo_key);
  const [rawCats, products] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true, limit: 300 })]);
  const all = flattenTree(rawCats);
  // Mega menu: each top category gets its sub-categories and 2 trending products (bestsellers first, then newest).
  const pickOf = (p: (typeof products)[number]): MenuPick => ({ name: p.name, slug: p.slug, price: p.price, compare: p.compare_price, image: imgUrl(p.images[0]) });
  const shown = new Set<number>();
  const cats = all.filter((c) => c.depth === 0).map((c) => {
    const ids = withChildren(rawCats, c.id);
    const picks = products.filter((p) => p.category_id != null && ids.includes(p.category_id) && p.images.length).slice(0, 2);
    picks.forEach((p) => shown.add(p.id));
    return { name: c.name, slug: c.slug, children: all.filter((k) => k.parent_id === c.id).map((k) => ({ name: k.name, slug: k.slug })), picks: picks.map(pickOf) };
  });
  // "All": one standout product that isn't already shown under a category.
  const allPickP = products.find((p) => p.images.length && !shown.has(p.id) && p.featured) ?? products.find((p) => p.images.length && !shown.has(p.id)) ?? products.find((p) => p.images.length);
  const allPick = allPickP ? pickOf(allPickP) : null;
  return (
    <CartProvider handle={s.handle}>
      <div data-look={s.storefront.look} className="min-h-dvh bg-background text-foreground">
        <ScrollTop />
        <StorePixels meta={s.storefront.pixels.meta} ga={s.storefront.pixels.ga} />
        {s.storefront.closed.on && <div className="bg-amber-400 px-4 py-2 text-center text-[12.5px] font-semibold text-black">{s.storefront.closed.message || "We're taking a short break — you can browse, and orders open again soon."}</div>}
        {s.storefront.bar.on && <AnnounceBar items={s.storefront.bar.items} />}
        <Suspense fallback={<div className="h-14 border-b border-border sm:h-16" />}><StoreHeader base={base} handle={s.handle} name={s.name} logo={logo} categories={cats} allPick={allPick} /></Suspense>
        <main>{children}</main>
        <StoreFooter store={s} base={base} logo={logo} categories={cats} />
        <WhatsAppFloat number={s.storefront.wa.on ? s.storefront.wa.number || s.contact.whatsapp || "" : ""} store={s.name} />
      </div>
    </CartProvider>
  );
}
