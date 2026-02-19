import { redirect } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getIsMobileRequest } from "@/lib/device/get-is-mobile-request";

export default async function PhotosPage() {
  const isMobile = await getIsMobileRequest();
  if (isMobile) redirect("/notes");
  return <AppShellPage appId="photos" />;
}
