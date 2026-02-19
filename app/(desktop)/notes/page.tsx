import { Metadata } from "next";
import { headers } from "next/headers";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { isMobileUserAgent } from "@/lib/is-mobile-user-agent";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function NotesPage() {
  const userAgent = (await headers()).get("user-agent");

  if (isMobileUserAgent(userAgent)) {
    return <MobileShell initialApp="notes" />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug="about-me" />;
}
