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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    setIsHydrated(true);

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent flash during hydration - use neutral background
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with notes app
  // If slug is provided, that note will be selected; otherwise shows sidebar
  if (isMobile) {
    return <MobileShell initialApp="notes" initialNoteSlug={slug} />;
  }

  // On desktop, show the desktop with notes window open
  // Default to about-me if no slug provided
  return <Desktop initialAppId="notes" initialNoteSlug={slug || "about-me"} />;
}
