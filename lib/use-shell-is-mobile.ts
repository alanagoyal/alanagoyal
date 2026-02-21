"use client";

import { useEffect, useState } from "react";
import { SHELL_POINTER_MEDIA_QUERY } from "@/lib/shell-routing";

export function useShellIsMobile(initialIsMobile?: boolean): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(
    typeof initialIsMobile === "boolean" ? initialIsMobile : null
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(SHELL_POINTER_MEDIA_QUERY);
    const syncIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    syncIsMobile();
    mediaQuery.addEventListener("change", syncIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", syncIsMobile);
    };
  }, []);

  return isMobile;
}
