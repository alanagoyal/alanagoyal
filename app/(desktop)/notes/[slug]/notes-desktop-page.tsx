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

interface NotesDesktopPageProps {
  slug?: string;
  initialIsMobile?: boolean;
  initialNote?: NoteType;
}

export function NotesDesktopPage({ slug, initialIsMobile = false, initialNote }: NotesDesktopPageProps) {
  const [isMobile, setIsMobile] = useState<boolean>(initialIsMobile);
  const [isClientReady, setIsClientReady] = useState<boolean>(initialIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const syncIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    syncIsMobile();
    setIsClientReady(true);

    // On desktop, redirect /notes to /notes/about-me for URL consistency
    if (!mediaQuery.matches && window.location.pathname === "/notes") {
      setUrl("/notes/about-me");
    }

    mediaQuery.addEventListener("change", syncIsMobile);
    return () => {
      mediaQuery.removeEventListener("change", syncIsMobile);
    };
  }, []);

  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} initialNote={initialNote} />;
  }

  if (!isClientReady) {
    return <div className="h-dvh bg-background" />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug || "about-me"} />;
}
