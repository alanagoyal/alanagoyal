"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { APPS, getAppById } from "@/lib/app-config";
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

// Animation states for dock icons
type AnimationState = "entering" | "exiting" | "stable";

export function Dock({ onTrashClick, onFinderClick }: DockProps) {
  const {
    openWindow,
    focusWindow,
    restoreWindow,
    getWindow,
    hasOpenWindows,
    bringAppToFront,
  } = useWindowManager();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  // Track which apps are visible and their animation states
  const [visibleApps, setVisibleApps] = useState<Set<string>>(new Set());
  const [animationStates, setAnimationStates] = useState<Record<string, AnimationState>>({});
  const initialRenderRef = useRef(true);
  const exitingAppsRef = useRef<Set<string>>(new Set());

  // Calculate which apps should currently be in the dock
  const currentAppsToShow = APPS.filter((app) => {
    const showByDefault = app.showOnDockByDefault !== false;
    return showByDefault || hasOpenWindows(app.id);
  }).map((app) => app.id);

  // Handle app visibility changes with animations
  useEffect(() => {
    const currentApps = new Set(currentAppsToShow);

    if (initialRenderRef.current) {
      // On initial render, all apps are stable (no animation)
      initialRenderRef.current = false;
      setVisibleApps(currentApps);
      const states: Record<string, AnimationState> = {};
      currentApps.forEach((appId) => {
        states[appId] = "stable";
      });
      setAnimationStates(states);
      return;
    }

    // Find apps that are entering (new apps not in visible set)
    const enteringApps: string[] = [];
    currentApps.forEach((appId) => {
      if (!visibleApps.has(appId) && !exitingAppsRef.current.has(appId)) {
        enteringApps.push(appId);
      }
    });

    // Find apps that are exiting (apps in visible set but not in current)
    const exitingApps: string[] = [];
    visibleApps.forEach((appId) => {
      if (!currentApps.has(appId) && !exitingAppsRef.current.has(appId)) {
        exitingApps.push(appId);
      }
    });

    if (enteringApps.length > 0 || exitingApps.length > 0) {
      // Update animation states
      setAnimationStates((prev) => {
        const next = { ...prev };
        enteringApps.forEach((appId) => {
          next[appId] = "entering";
        });
        exitingApps.forEach((appId) => {
          next[appId] = "exiting";
          exitingAppsRef.current.add(appId);
        });
        return next;
      });

      // Add entering apps to visible set
      if (enteringApps.length > 0) {
        setVisibleApps((prev) => {
          const next = new Set(prev);
          enteringApps.forEach((appId) => next.add(appId));
          return next;
        });
      }

      // After animation, mark entering apps as stable
      if (enteringApps.length > 0) {
        setTimeout(() => {
          setAnimationStates((prev) => {
            const next = { ...prev };
            enteringApps.forEach((appId) => {
              if (next[appId] === "entering") {
                next[appId] = "stable";
              }
            });
            return next;
          });
        }, 900);
      }

      // After animation, remove exiting apps from visible set
      if (exitingApps.length > 0) {
        setTimeout(() => {
          setVisibleApps((prev) => {
            const next = new Set(prev);
            exitingApps.forEach((appId) => {
              next.delete(appId);
              exitingAppsRef.current.delete(appId);
            });
            return next;
          });
          setAnimationStates((prev) => {
            const next = { ...prev };
            exitingApps.forEach((appId) => {
              delete next[appId];
            });
            return next;
          });
        }, 400);
      }
    }
  }, [currentAppsToShow.join(","), visibleApps]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAppClick = (appId: string) => {
    // Special handling for Finder to reset tab to recents
    if (appId === "finder" && onFinderClick) {
      onFinderClick();
      return;
    }

    const app = getAppById(appId);

    // For multi-window apps, bring all windows to front
    if (app?.multiWindow) {
      if (hasOpenWindows(appId)) {
        bringAppToFront(appId);
      }
      // If no windows open, do nothing (can't open TextEdit without a file)
      return;
    }

    // Single-window app handling
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
  };

  const handleTrashClick = () => {
    if (onTrashClick) {
      onTrashClick();
    }
  };

  // Get ordered list of apps to render (maintaining order from APPS array)
  const appsToRender = APPS.filter((app) => visibleApps.has(app.id));

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60]">
      <div className="flex items-end gap-1 px-2 py-1 bg-white/30 dark:bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-lg transition-all duration-300">
        {appsToRender.map((app) => {
          const isOpen = hasOpenWindows(app.id);
          const animState = animationStates[app.id] || "stable";

          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              className={cn(
                "group relative flex flex-col items-center p-1 outline-none transition-all duration-300",
                animState === "entering" && "animate-dock-enter",
                animState === "exiting" && "animate-dock-exit",
                animState === "stable" && "hover:scale-110 active:scale-95"
              )}
            >
              {hoveredApp === app.id && animState === "stable" && (
                <DockTooltip label={app.name} />
              )}
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
                  // Finder always shows dot (can be closed but not quit)
                  isOpen || app.id === "finder"
                    ? "bg-black/60 dark:bg-white/60 opacity-100"
                    : "opacity-0"
                )}
              />
            </button>
          );
        })}
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
      </div>
    </div>
  );
}
