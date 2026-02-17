"use client";

/**
 * Shared page component for /notes and /notes/[slug] routes.
 *
 * Routing behavior:
 * - Desktop /notes:       Updates URL to /notes/about-me, shows desktop with default note
 * - Desktop /notes/slug:  Shows desktop with specified note
 * - Mobile /notes:        Shows sidebar only (no URL change)
 * - Mobile /notes/slug:   Shows full note view
 */

import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { useDesktopShellRoute } from "@/lib/desktop/use-desktop-shell-route";

interface NotesDesktopPageProps {
  slug?: string;
}

export function NotesDesktopPage({ slug }: NotesDesktopPageProps) {
  const { isMobile, isHydrated, route } = useDesktopShellRoute({
    defaultAppId: "notes",
    defaultNoteSlug: slug || "about-me",
    normalizeNotesRootOnDesktop: true,
  });

  // Prevent flash during hydration - use neutral background
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with notes app
  // If slug is provided, that note will be selected; otherwise shows sidebar
  if (isMobile) {
    return <MobileShell initialApp={route.appId} initialNoteSlug={route.noteSlug || slug} />;
  }

  return (
    <Desktop
      initialAppId={route.appId}
      initialNoteSlug={route.noteSlug}
      initialTextEditFile={route.textEditFile}
      initialPreviewFile={route.previewFile}
    />
  );
}
