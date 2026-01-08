"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function SettingsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>("settings");
  const [currentNoteSlug, setCurrentNoteSlug] = useState<string | undefined>();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check current URL to determine which app should be focused
    const checkUrl = () => {
      const path = window.location.pathname;
      if (path.startsWith("/notes")) {
        setCurrentApp("notes");
        const match = path.match(/^\/notes\/(.+)$/);
        setCurrentNoteSlug(match ? match[1] : undefined);
      } else if (path.startsWith("/messages")) {
        setCurrentApp("messages");
        setCurrentNoteSlug(undefined);
      } else if (path.startsWith("/settings")) {
        setCurrentApp("settings");
        setCurrentNoteSlug(undefined);
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
  }, []);

  // Prevent flash during hydration - use neutral background
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with settings app selected
  if (isMobile) {
    return <MobileShell initialApp="settings" />;
  }

  // On desktop, show the desktop with the current app focused (based on URL)
  return <Desktop initialAppId={currentApp} initialNoteSlug={currentNoteSlug} />;
}
