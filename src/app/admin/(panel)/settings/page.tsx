import { getSettings } from "@/lib/server/content";
import { getIntegrations } from "@/lib/server/integrations";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata = { title: "Settings & Branding" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [s, integrations] = await Promise.all([getSettings(), getIntegrations()]);
  return <SettingsEditor initial={JSON.parse(JSON.stringify({ ...s, integrations }))} />;
}
