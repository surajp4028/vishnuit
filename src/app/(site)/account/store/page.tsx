import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/users";
import { getCatalogConfig, getStoreForUser } from "@/lib/server/catalog";
import { CreateStore } from "@/components/store/create-store";

export const metadata: Metadata = { title: "Create your store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Enroll page. Merchants who already have a store are sent to the seller panel. */
export default async function CreateStorePage() {
  const u = await requireUser("/account/store");
  const [store, conf] = await Promise.all([getStoreForUser(u.id), getCatalogConfig()]);
  const paused = (t: string, d: string) => (
    <section className="px-4 pt-32 pb-24 text-center md:pt-40">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{d}</p>
    </section>
  );
  if (!conf.features.enabled) return paused("Online stores are paused", "We're making improvements. Your store and products are safe — please check back soon.");
  if (store) redirect("/seller");
  if (!conf.features.newStores) return paused("New stores are opening soon", "We're not accepting new stores right now. Please check back soon.");
  const base = (u.name || u.email?.split("@")[0] || "store").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  return <CreateStore suggested={base.length >= 3 ? base : `store${u.uid.slice(-4)}`} />;
}
