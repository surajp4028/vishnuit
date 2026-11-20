import { getCatalogConfig } from "@/lib/server/catalog";
import { CatalogSettings } from "@/components/admin/catalog-settings";

export const metadata = { title: "Catalog Settings" };
export const dynamic = "force-dynamic";

export default async function CatalogSettingsPage() {
  const cfg = (await getCatalogConfig()) as Awaited<ReturnType<typeof getCatalogConfig>> & { rawFeatures?: unknown };
  // Show the switches exactly as saved (not the "everything off" view the master switch produces).
  return <CatalogSettings initial={JSON.parse(JSON.stringify({ ...cfg, features: cfg.rawFeatures ?? cfg.features }))} />;
}
