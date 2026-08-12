import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function SettingsPage() {
  await redirectIfUnsupportedOnMobile("settings");

  return <AppShellPage appId="settings" />;
}
