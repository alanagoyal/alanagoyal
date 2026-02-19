import { Metadata } from "next";
import { isMobileRequest } from "@/lib/server/is-mobile-request";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function NotesPage() {
  const initialIsMobile = (await isMobileRequest()) ? true : undefined;

  // On mobile: shows sidebar (no note selected)
  // On desktop: shows notes window with about-me selected
  return <NotesDesktopPage initialIsMobile={initialIsMobile} />;
}
