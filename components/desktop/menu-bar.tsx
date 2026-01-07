"use client";

import { useEffect, useState } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function MenuBar() {
  const { getFocusedAppId } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>("");

  const focusedAppId = getFocusedAppId();
  const focusedApp = focusedAppId ? getAppById(focusedAppId) : null;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-7 bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4 z-50 select-none">
      <div className="flex items-center gap-4">
        <AppleLogo className="w-4 h-4 text-black dark:text-white" />
        <span className="text-sm font-semibold text-black dark:text-white">
          {focusedApp?.menuBarTitle || "Finder"}
        </span>
      </div>
      <div className="text-sm text-black dark:text-white">{currentTime}</div>
    </div>
  );
}
