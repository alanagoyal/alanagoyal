"use client";

/**
 * Shared page component for /notes and /notes/[slug] routes.
 *
 * Routing behavior:
 * - Desktop /notes:       Shows desktop Notes app (app decides selected note)
 * - Desktop /notes/slug:  Shows desktop with specified note
 * - Mobile /notes:        Shows sidebar only (no URL change)
 * - Mobile /notes/slug:   Shows full note view
 */

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import type { Note as NoteType } from "@/lib/notes/types";
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
  }, [isMobile]);

  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} initialNote={initialNote} />;
  }

  if (!isClientReady) {
    return <div className="h-dvh bg-background" />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug} />;
}
