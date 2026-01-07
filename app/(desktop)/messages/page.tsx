"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function MessagesPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>("messages");
  const [currentNoteSlug, setCurrentNoteSlug] = useState<string | undefined>();

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
        setCurrentNoteSlug(match ? match[1] : undefined);
      } else {
        setCurrentApp("messages");
        setCurrentNoteSlug(undefined);
      }
    };

    checkMobile();
    checkUrl();
    setIsHydrated(true);

    window.addEventListener("resize", () => {
      checkMobile();
      checkUrl();
    });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent flash during hydration - use neutral background
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with messages app selected
  if (isMobile) {
    return <MobileShell initialApp="messages" />;
  }

  // On desktop, show the desktop with the current app focused (based on URL)
  return <Desktop initialAppId={currentApp} initialNoteSlug={currentNoteSlug} />;
}
