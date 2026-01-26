"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function CalendarPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth < 768;
    };

    setIsMobile(checkMobile());
    setIsHydrated(true);

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent flash during hydration
  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  // On mobile, show the mobile shell with calendar app
  if (isMobile) {
    return <MobileShell initialApp="calendar" />;
  }

  // On desktop, show the desktop with calendar focused
  return <Desktop initialAppId="calendar" />;
}
