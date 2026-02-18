import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import HomeClient from "./home-client";
import { detectInitialIsMobile } from "@/lib/server/device-detect";

export const metadata: Metadata = {
  title: siteConfig.title,
  openGraph: {
    images: [
      `/notes/api/og/?title=${encodeURIComponent("about me")}&emoji=${encodeURIComponent("👋🏼")}`,
    ],
  },
};

export default async function Home() {
  const initialIsMobile = await detectInitialIsMobile();
  return <HomeClient initialIsMobile={initialIsMobile} />;
}
