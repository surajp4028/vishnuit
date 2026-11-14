import "server-only";
import { cache } from "react";
import { queryOne } from "./db";

export type Integrations = {
  metaPixelId: string;
  metaCapiToken: string;
  metaTestEventCode: string;
  gsheetWebhookUrl: string;
  gsheetSecret: string;
  gsheetId: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  lpTab: string;
  siteTab: string;
  lpSheetEnabled: boolean;
  siteSheetEnabled: boolean;
};

/** Values saved in Admin → Settings → Integrations win; env vars are the fallback. Never sent to the browser (except the Pixel ID). */
export const getIntegrations = cache(async (): Promise<Integrations> => {
  let db: Partial<Integrations> = {};
  try {
    const row = await queryOne<{ v: unknown }>("SELECT v FROM settings WHERE k='integrations'");
    if (row) db = (typeof row.v === "string" ? JSON.parse(row.v) : row.v) as Partial<Integrations>;
  } catch {}
  const e = process.env;
  const pick = (k: keyof Integrations, env?: string) => String((db[k] as string) || env || "").trim();
  return {
    metaPixelId: pick("metaPixelId", e.NEXT_PUBLIC_META_PIXEL_ID),
    metaCapiToken: pick("metaCapiToken", e.META_CAPI_TOKEN),
    metaTestEventCode: pick("metaTestEventCode", e.META_TEST_EVENT_CODE),
    gsheetWebhookUrl: pick("gsheetWebhookUrl", e.GSHEET_WEBHOOK_URL),
    gsheetSecret: pick("gsheetSecret", e.GSHEET_SECRET),
    gsheetId: pick("gsheetId", e.GSHEET_ID),
    googleServiceAccountEmail: pick("googleServiceAccountEmail", e.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    googlePrivateKey: pick("googlePrivateKey", e.GOOGLE_PRIVATE_KEY),
    lpTab: pick("lpTab", e.GSHEET_LP_TAB) || "LP Leads",
    siteTab: pick("siteTab", e.GSHEET_SITE_TAB) || "Website Leads",
    lpSheetEnabled: db.lpSheetEnabled ?? true,
    siteSheetEnabled: db.siteSheetEnabled ?? true,
  };
});

export const INTEGRATION_DEFAULTS: Integrations = {
  metaPixelId: "", metaCapiToken: "", metaTestEventCode: "",
  gsheetWebhookUrl: "", gsheetSecret: "", gsheetId: "", googleServiceAccountEmail: "", googlePrivateKey: "",
  lpTab: "LP Leads", siteTab: "Website Leads", lpSheetEnabled: true, siteSheetEnabled: true,
};
