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

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { setUrl } from "@/lib/set-url";
import type { Note as NoteType } from "@/lib/notes/types";
import { getNotesRoute, SHELL_DEFAULT_NOTE_SLUG, SHELL_NOTES_ROOT_PATH } from "@/lib/shell-routing";
import { useShellIsMobile } from "@/lib/use-shell-is-mobile";

interface NotesDesktopPageProps {
  slug?: string;
  initialIsMobile?: boolean;
  initialNote?: NoteType;
}

export function NotesDesktopPage({ slug, initialIsMobile = false, initialNote }: NotesDesktopPageProps) {
  const isMobile = useShellIsMobile(initialIsMobile ? true : undefined);
  const [isClientReady, setIsClientReady] = useState<boolean>(initialIsMobile);

  useEffect(() => {
    if (isMobile === null) return;

    setIsClientReady(true);

    // On desktop, redirect /notes to /notes/about-me for URL consistency
    if (!isMobile && window.location.pathname === SHELL_NOTES_ROOT_PATH) {
      setUrl(getNotesRoute());
    }
  }, [isMobile]);

  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} initialNote={initialNote} />;
  }

  if (!isClientReady) {
    return <div className="h-dvh bg-background" />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug || SHELL_DEFAULT_NOTE_SLUG} />;
}
