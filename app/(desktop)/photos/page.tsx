"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function PhotosPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>("photos");
  const [currentNoteSlug, setCurrentNoteSlug] = useState<string | undefined>();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const checkUrl = () => {
      const path = window.location.pathname;
      if (path.startsWith("/notes")) {
        setCurrentApp("notes");
        const match = path.match(/^\/notes\/(.+)$/);
        setCurrentNoteSlug(match ? match[1] : undefined);
      } else if (path.startsWith("/photos")) {
        setCurrentApp("photos");
        setCurrentNoteSlug(undefined);
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

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isMobile) {
    return <MobileShell initialApp="photos" />;
  }

  return <Desktop initialAppId={currentApp} initialNoteSlug={currentNoteSlug} />;
}
