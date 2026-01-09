"use client";

import Image from "next/image";
import { useState } from "react";
import { APPS } from "@/lib/app-config";
import { useWindowManager } from "@/lib/window-context";
import { cn } from "@/lib/utils";

function DockTooltip({ label }: { label: string }) {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
      <svg
        viewBox="0 0 100 40"
        className="h-8 min-w-16"
        style={{ width: `${Math.max(64, label.length * 9 + 24)}px` }}
        preserveAspectRatio="none"
      >
        <path
          d="M 8 0
             H 92
             C 96 0 100 4 100 8
             V 24
             C 100 28 96 32 92 32
             H 56
             L 50 38
             L 44 32
             H 8
             C 4 32 0 28 0 24
             V 8
             C 0 4 4 0 8 0
             Z"
          fill="rgba(30, 30, 30, 0.9)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium pb-1.5 whitespace-nowrap px-3">
        {label}
      </span>
    </div>
  );
}

export function Dock() {
  const { openWindow, focusWindow, restoreWindow, isWindowOpen, getWindow } = useWindowManager();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

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
    } else if (appId === "settings") {
      window.history.replaceState(null, "", "/settings");
    } else if (appId === "iterm") {
      window.history.replaceState(null, "", "/iterm");
    } else if (appId === "finder") {
      window.history.replaceState(null, "", "/finder");
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
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              className="group relative flex flex-col items-center p-1 transition-transform hover:scale-110 active:scale-95"
            >
              {hoveredApp === app.id && <DockTooltip label={app.name} />}
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
