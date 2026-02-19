import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { isMobileUserAgent } from "@/lib/is-mobile-user-agent";

export const metadata: Metadata = {
  title: siteConfig.title,
  openGraph: {
    images: [
      `/notes/api/og/?title=${encodeURIComponent("about me")}&emoji=${encodeURIComponent("👋🏼")}`,
    ],
  },
};

export default async function Home() {
  const userAgent = (await headers()).get("user-agent");

  if (isMobileUserAgent(userAgent)) {
    redirect("/notes");
  }

  return <AppShellPage />;
}
