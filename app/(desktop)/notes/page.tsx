import { Metadata } from "next";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";
import { getIsMobileRequest } from "@/lib/device/get-is-mobile-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function NotesPage() {
  const isMobile = await getIsMobileRequest();
  return <NotesDesktopPage isMobile={isMobile} />;
}
