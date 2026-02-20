import { Metadata } from "next";
import { headers } from "next/headers";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

async function isMobileRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const clientHintMobile = requestHeaders.get("sec-ch-ua-mobile");

  if (clientHintMobile === "?1") {
    return true;
  }

  const userAgent = requestHeaders.get("user-agent") || "";
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function NotesPage() {
  const initialIsMobile = await isMobileRequest();

  // On mobile: shows sidebar (no note selected)
  // On desktop: shows notes window with about-me selected
  return <NotesDesktopPage initialIsMobile={initialIsMobile} />;
}
