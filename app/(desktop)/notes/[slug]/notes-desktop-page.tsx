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
import { persistDeviceClassCookie } from "@/lib/device-class";

interface NotesDesktopPageProps {
  slug?: string;
  initialIsMobile: boolean;
}

export function NotesDesktopPage({ slug, initialIsMobile }: NotesDesktopPageProps) {
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    persistDeviceClassCookie(isMobile);
  }, [isMobile]);

  useEffect(() => {
    // On desktop, redirect /notes to /notes/about-me for URL consistency
    if (!isMobile && window.location.pathname === "/notes") {
      setUrl("/notes/about-me");
    }
  }, [isMobile]);

  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug={slug || "about-me"} />;
}
