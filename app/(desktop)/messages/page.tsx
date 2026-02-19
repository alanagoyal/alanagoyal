import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getIsMobileRequest } from "@/lib/device/get-is-mobile-request";

export default async function MessagesPage() {
  const isMobile = await getIsMobileRequest();
  return <AppShellPage appId="messages" forceMobile={isMobile} />;
}
