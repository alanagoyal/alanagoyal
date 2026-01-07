"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function MessagesPage() {
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

  // On mobile, show the mobile shell with messages app selected
  if (isMobile) {
    return <MobileShell initialApp="messages" />;
  }

  // On desktop, show the desktop with messages window open
  return <Desktop initialAppId="messages" />;
}
