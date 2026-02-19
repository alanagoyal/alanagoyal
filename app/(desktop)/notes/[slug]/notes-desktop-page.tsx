import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

interface NotesDesktopPageProps {
  slug?: string;
  isMobile: boolean;
}

export function NotesDesktopPage({ slug, isMobile }: NotesDesktopPageProps) {
  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug || "about-me"} />;
}
