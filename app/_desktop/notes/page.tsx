import { Metadata } from "next";
import { Desktop } from "@/components/desktop/desktop";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default function DesktopNotesPage() {
  return <Desktop initialAppId="notes" />;
}
