import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  openGraph: {
    images: [
      `/notes/api/og/?title=${encodeURIComponent("about me")}&emoji=${encodeURIComponent("👋🏼")}`,
    ],
  },
};

export default function Home() {
  return <HomeClient />;
}
