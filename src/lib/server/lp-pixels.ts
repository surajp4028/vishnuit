import "server-only";
import { cache } from "react";
import { queryOne } from "./db";
import { getIntegrations } from "./integrations";

/** Optional per-landing-page Meta Pixel override, saved in settings k='lpPixels' as { [slug]: { pixelId, capiToken } }. */
export type LpPixel = { pixelId: string; capiToken: string };

export const getLpPixels = cache(async (): Promise<Record<string, LpPixel>> => {
  try {
    const row = await queryOne<{ v: unknown }>("SELECT v FROM settings WHERE k='lpPixels'");
    if (row) return (typeof row.v === "string" ? JSON.parse(row.v) : row.v) as Record<string, LpPixel>;
  } catch {}
  return {};
});

/** Pixel to use for a landing page: its own pixel if set, otherwise the common pixel from Settings → Integrations. */
export async function resolveLpPixel(slug?: string | null): Promise<{ pixelId: string; capiToken: string; own: boolean }> {
  const [common, map] = await Promise.all([getIntegrations(), getLpPixels()]);
  const own = slug ? map[slug] : undefined;
  if (own?.pixelId) return { pixelId: own.pixelId, capiToken: own.capiToken || "", own: true };
  return { pixelId: common.metaPixelId, capiToken: common.metaCapiToken, own: false };
}
