"use client";

import Image from "next/image";
import { APPS } from "@/lib/app-config";
import { useWindowManager } from "@/lib/window-context";
import { cn } from "@/lib/utils";

export function Dock() {
  const { openWindow, focusWindow, restoreWindow, isWindowOpen, getWindow } = useWindowManager();

  const handleAppClick = (appId: string) => {
    const windowState = getWindow(appId);
    if (windowState?.isOpen) {
      if (windowState.isMinimized) {
        restoreWindow(appId);
      } else {
        focusWindow(appId);
      }
    } else {
      openWindow(appId);
    }

    // Update URL based on which app was clicked
    if (appId === "messages") {
      window.history.replaceState(null, "", "/messages");
    } else if (appId === "notes") {
      // Keep current note URL if on notes, otherwise use default
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        window.history.replaceState(null, "", "/notes/about-me");
      }
    } else if (appId === "iterm") {
      window.history.replaceState(null, "", "/iterm");
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60]">
      <div className="flex items-end gap-1 px-2 py-1 bg-white/30 dark:bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
        {APPS.map((app) => {
          const isOpen = isWindowOpen(app.id);
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              className="group relative flex flex-col items-center p-1 transition-transform hover:scale-110 active:scale-95"
              title={app.name}
            >
              <div className="w-12 h-12 relative">
                <Image
                  src={app.icon}
                  alt={app.name}
                  width={48}
                  height={48}
                  className="rounded-xl shadow-md"
                />
              </div>
              <div
                className={cn(
                  "w-1 h-1 rounded-full mt-1 transition-opacity",
                  isOpen
                    ? "bg-black/60 dark:bg-white/60 opacity-100"
                    : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
