"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

export default function Home() {
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

  // Prevent flash during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
    );
  }

  return isMobile ? <MobileShell /> : <Desktop />;
}
