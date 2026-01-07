import { Metadata } from "next";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal | notes",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default function NotesPage() {
  // Render Desktop with notes app focused (no specific note)
  return <NotesDesktopPage slug="about-me" />;
}