import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function ITermPage() {
  await redirectIfUnsupportedOnMobile("iterm");

  return <AppShellPage appId="iterm" />;
}
