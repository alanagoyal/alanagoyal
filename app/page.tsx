import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "notes",
    openGraph: {
      images: [`/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function Home() {}