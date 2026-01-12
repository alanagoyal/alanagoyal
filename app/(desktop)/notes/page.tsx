import { Metadata } from "next";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default function NotesPage() {
  // On mobile: shows sidebar (no note selected)
  // On desktop: shows notes window with about-me selected
  return <NotesDesktopPage />;
}