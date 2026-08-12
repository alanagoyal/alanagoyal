import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function FinderPage() {
  await redirectIfUnsupportedOnMobile("finder");

  return <AppShellPage appId="finder" />;
}
