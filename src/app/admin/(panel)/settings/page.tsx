import { getSettings } from "@/lib/server/content";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata = { title: "Settings & Branding" };

export default async function SettingsPage() {
  const s = await getSettings();
  return <SettingsEditor initial={JSON.parse(JSON.stringify(s))} />;
}
