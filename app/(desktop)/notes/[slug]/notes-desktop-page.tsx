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
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>("notes");
  const [currentNoteSlug, setCurrentNoteSlug] = useState<string | undefined>(slug);

  useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth < 768;
    };

    // Check current URL to determine which app should be focused
    // This handles the case where user navigated via MobileShell's tab bar
    const checkUrl = (mobile: boolean) => {
      const path = window.location.pathname;
      if (path.startsWith("/notes")) {
        setCurrentApp("notes");
        const match = path.match(/^\/notes\/(.+)$/);
        const noteSlug = match ? match[1] : slug || "about-me";
        setCurrentNoteSlug(noteSlug);

        // On desktop, redirect /notes to /notes/about-me for URL consistency
        if (!mobile && path === "/notes") {
          window.history.replaceState(null, "", "/notes/about-me");
        }
      } else if (path.startsWith("/messages")) {
        setCurrentApp("messages");
      } else if (path.startsWith("/settings")) {
        setCurrentApp("settings");
      }
    };

    const mobile = checkMobile();
    setIsMobile(mobile);
    checkUrl(mobile);
    setIsHydrated(true);

    const handleResize = () => {
      const mobile = checkMobile();
      setIsMobile(mobile);
      checkUrl(mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slug]);

  // Prevent flash during hydration - use neutral background
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with notes app
  // If slug is provided, that note will be selected; otherwise shows sidebar
  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} />;
  }

  // On desktop, show the desktop with the current app focused (based on URL)
  return <Desktop initialAppId={currentApp} initialNoteSlug={currentNoteSlug} />;
}
