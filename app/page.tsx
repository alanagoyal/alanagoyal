import { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { isMobileRequest } from "@/lib/server/is-mobile-request";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  openGraph: {
    images: [
      `/notes/api/og/?title=${encodeURIComponent("about me")}&emoji=${encodeURIComponent("👋🏼")}`,
    ],
  },
};

export default async function Home() {
  if (await isMobileRequest()) {
    redirect("/notes");
  }

  return <HomeClient />;
}
