import { query } from "@/lib/server/db";
import { getIntegrations } from "@/lib/server/integrations";
import { getLpPixels } from "@/lib/server/lp-pixels";
import { LANDING_PAGES } from "@/data/landing-pages";
import { LandingPagesManager, type LpRow } from "@/components/admin/landing-pages-manager";

export const metadata = { title: "Landing Pages" };
export const dynamic = "force-dynamic";

type Stat = { source: string; total: number; d7: number; today: number; last: string | null };

export default async function LandingPagesAdmin() {
  const [stats, common, pixels] = await Promise.all([
    query<Stat>(
      `SELECT source, COUNT(*) total, SUM(created_at >= NOW() - INTERVAL 7 DAY) d7, SUM(DATE(created_at) = CURDATE()) today, MAX(created_at) last
       FROM leads WHERE source LIKE 'lp:%' GROUP BY source`,
    ).catch(() => [] as Stat[]),
    getIntegrations(),
    getLpPixels(),
  ]);
  const by = Object.fromEntries(stats.map((s) => [s.source.replace(/^lp:/, ""), s]));
  const rows: LpRow[] = LANDING_PAGES.map((p) => {
    const s = by[p.slug];
    const own = pixels[p.slug];
    return {
      slug: p.slug,
      title: p.metaTitle,
      headline: `${p.headline} ${p.highlight}`,
      leads: { total: Number(s?.total ?? 0), d7: Number(s?.d7 ?? 0), today: Number(s?.today ?? 0), last: s?.last ? String(s.last) : null },
      pixelId: own?.pixelId ?? "",
      hasToken: Boolean(own?.capiToken),
    };
  });
  return <LandingPagesManager rows={rows} commonPixel={common.metaPixelId} commonHasToken={Boolean(common.metaCapiToken)} />;
}
