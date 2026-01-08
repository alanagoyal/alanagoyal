"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

interface NotesDesktopPageProps {
  slug?: string; // Optional - if not provided on mobile, shows sidebar only
}

export function NotesDesktopPage({ slug }: NotesDesktopPageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>("notes");
  const [currentNoteSlug, setCurrentNoteSlug] = useState<string | undefined>(slug);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check current URL to determine which app should be focused
    // This handles the case where user navigated via MobileShell's tab bar
    const checkUrl = () => {
      const path = window.location.pathname;
      if (path.startsWith("/notes")) {
        setCurrentApp("notes");
        const match = path.match(/^\/notes\/(.+)$/);
        setCurrentNoteSlug(match ? match[1] : slug || "about-me");
      } else if (path.startsWith("/messages")) {
        setCurrentApp("messages");
      } else if (path.startsWith("/settings")) {
        setCurrentApp("settings");
      }
    };

    checkMobile();
    checkUrl();
    setIsHydrated(true);

    const handleResize = () => {
      checkMobile();
      checkUrl();
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
