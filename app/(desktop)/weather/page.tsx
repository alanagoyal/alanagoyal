import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { isMobileRequest } from "@/lib/is-mobile-request";
import { redirect } from "next/navigation";

export default async function WeatherPage() {
  const initialIsMobile = await isMobileRequest();
  if (initialIsMobile) {
    return redirect("/");
  }

  return <AppShellPage appId="weather" />;
}
