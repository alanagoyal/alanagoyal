import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function GamesPage() {
  await redirectIfUnsupportedOnMobile("games");

  return <AppShellPage appId="games" />;
}
