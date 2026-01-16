"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { APPS } from "@/lib/app-config";
import { useWindowManager } from "@/lib/window-context";
import { cn } from "@/lib/utils";

interface DockProps {
  onTrashClick?: () => void;
  onFinderClick?: () => void;
}

function DockTooltip({ label }: { label: string }) {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
      <svg
        viewBox="0 0 100 44"
        className="h-9 min-w-16"
        style={{ width: `${Math.max(64, label.length * 9 + 24)}px` }}
        preserveAspectRatio="none"
      >
        <path
          d="M 12 0
             H 88
             Q 100 0 100 12
             V 20
             Q 100 32 88 32
             H 56
             L 50 38
             L 44 32
             H 12
             Q 0 32 0 20
             V 12
             Q 0 0 12 0
             Z"
          className="fill-white/70 dark:fill-zinc-800/70"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-zinc-800 dark:text-white text-xs font-medium pb-2 whitespace-nowrap px-3">
        {label}
      </span>
    </div>
  );
}

export function Dock({ onTrashClick, onFinderClick }: DockProps) {
  const { openWindow, focusWindow, restoreWindow, isWindowOpen, getWindow } = useWindowManager();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const handleAppClick = (appId: string) => {
    // Special handling for Finder to reset tab to projects
    if (appId === "finder" && onFinderClick) {
      onFinderClick();
      return;
    }

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
    } else if (appId === "photos") {
      window.history.replaceState(null, "", "/photos");
    } else if (appId === "textedit") {
      window.history.replaceState(null, "", "/textedit");
    }
  };

  const handleTrashClick = () => {
    if (onTrashClick) {
      onTrashClick();
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60]">
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
        }}
        className="flex items-end gap-1 px-2 py-1 bg-white/30 dark:bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-lg"
      >
        <AnimatePresence>
          {APPS.filter((app) => {
            // Show app if it should appear by default OR if it's currently open
            const showByDefault = app.showOnDockByDefault !== false;
            return showByDefault || isWindowOpen(app.id);
          }).map((app) => {
            const isOpen = isWindowOpen(app.id);
            return (
              <motion.button
                key={app.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  opacity: { delay: 0.15 },
                  y: { delay: 0.15 },
                }}
                onClick={() => handleAppClick(app.id)}
                onMouseEnter={() => setHoveredApp(app.id)}
                onMouseLeave={() => setHoveredApp(null)}
                className="group relative flex flex-col items-center p-1 hover:scale-110 active:scale-95 outline-none"
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
              </motion.button>
            );
          })}
        </AnimatePresence>
        {/* Trash icon - uses custom sizing because unlike square app icons,
           the trash SVG has a tall aspect ratio with built-in padding */}
        <button
          onClick={handleTrashClick}
          onMouseEnter={() => setHoveredApp("trash")}
          onMouseLeave={() => setHoveredApp(null)}
          className="group relative flex flex-col items-center p-1 transition-transform hover:scale-110 active:scale-95 outline-none"
        >
          {hoveredApp === "trash" && <DockTooltip label="Trash" />}
          <div className="h-12 relative flex items-end">
            <Image
              src="/trash.svg"
              alt="Trash"
              width={48}
              height={48}
              className="h-[52px] w-auto translate-y-0.5"
            />
          </div>
          {/* Trash doesn't show open indicator */}
          <div className="w-1 h-1 rounded-full mt-1 opacity-0" />
        </button>
      </motion.div>
    </div>
  );
}
