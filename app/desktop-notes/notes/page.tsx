import { Metadata } from "next";
import { DesktopNotesShell } from "./desktop-notes-shell";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default function DesktopNotesPage() {
  return <DesktopNotesShell />;
}
