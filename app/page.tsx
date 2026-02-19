import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getIsMobileRequest } from "@/lib/device/get-is-mobile-request";

export const metadata: Metadata = {
  title: siteConfig.title,
  openGraph: {
    images: [
      `/notes/api/og/?title=${encodeURIComponent("about me")}&emoji=${encodeURIComponent("👋🏼")}`,
    ],
  },
};

export default async function Home() {
  const isMobile = await getIsMobileRequest();
  return <AppShellPage appId="notes" forceMobile={isMobile} />;
}
