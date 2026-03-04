import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function WeatherPage() {
  await redirectIfUnsupportedOnMobile("weather");

  return <AppShellPage appId="weather" />;
}
