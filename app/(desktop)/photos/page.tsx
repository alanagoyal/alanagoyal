import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { detectInitialIsMobile } from "@/lib/server/device-detect";

export default async function PhotosPage() {
  const initialIsMobile = await detectInitialIsMobile();
  return <AppShellPage appId="photos" initialIsMobile={initialIsMobile} />;
}
