import { Metadata } from "next";
import { MobileNotesPage } from "./mobile-notes-page";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default function MobileNotesIndexPage() {
  return <MobileNotesPage />;
}
