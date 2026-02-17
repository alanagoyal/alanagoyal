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

interface NotesDesktopPageProps {
  slug?: string;
}

export function NotesDesktopPage({ slug }: NotesDesktopPageProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(mobile);

    // On desktop, redirect /notes to /notes/about-me for URL consistency
    if (!mobile && window.location.pathname === "/notes") {
      window.history.replaceState(null, "", "/notes/about-me");
    }
  }, []);

  if (isMobile === null) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug || "about-me"} />;
}
