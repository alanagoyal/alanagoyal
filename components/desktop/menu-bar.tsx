"use client";

import { useEffect, useState } from "react";
import { Apple } from "lucide-react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";

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
        <Apple className="w-4 h-4 text-black dark:text-white" />
        <span className="text-sm font-semibold text-black dark:text-white">
          {focusedApp?.menuBarTitle || "Finder"}
        </span>
      </div>
      <div className="text-sm text-black dark:text-white">{currentTime}</div>
    </div>
  );
}
