"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { APPS, getAppById } from "@/lib/app-config";
import { useWindowManager } from "@/lib/window-context";
import { cn } from "@/lib/utils";
import { CalendarDockIcon } from "@/components/apps/calendar/calendar-dock-icon";

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

// Get default dock apps (those that should show by default)
const getDefaultDockApps = () => {
  return APPS.filter((app) => app.showOnDockByDefault !== false).map((app) => app.id);
};

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
  // Initialize with default dock apps so they don't animate on page load
  const [visibleApps, setVisibleApps] = useState<Set<string>>(
    () => new Set(getDefaultDockApps())
  );
  const [animationStates, setAnimationStates] = useState<Record<string, AnimationState>>(() => {
    const states: Record<string, AnimationState> = {};
    getDefaultDockApps().forEach((appId) => {
      states[appId] = "stable";
    });
    return states;
  });
  const exitingAppsRef = useRef<Set<string>>(new Set());

  // Track apps that existed on initial mount - these skip enter animation on first appearance
  // but will animate if closed and reopened (removed from this set on exit)
  const initialAppsRef = useRef<Set<string> | null>(null);

  // Calculate which apps should currently be in the dock
  const currentAppsToShow = APPS.filter((app) => {
    const showByDefault = app.showOnDockByDefault !== false;
    return showByDefault || hasOpenWindows(app.id);
  }).map((app) => app.id);

  // Serialize for stable dependency comparison
  const currentAppsKey = currentAppsToShow.join(",");

  // Capture initial apps on first render (includes restored windows from sessionStorage)
  // This runs during render to capture state before the first effect
  if (initialAppsRef.current === null) {
    initialAppsRef.current = new Set(currentAppsToShow);
  }

  // Handle app visibility changes with animations
  // State machine: apps transition through entering -> stable -> exiting -> removed
  useEffect(() => {
    const currentApps = new Set(currentAppsToShow);

    // Find apps from initial mount that need to be added with stable state (no animation)
    // This handles restored windows from sessionStorage on page refresh
    const stableApps: string[] = [];
    currentApps.forEach((appId) => {
      if (
        !visibleApps.has(appId) &&
        initialAppsRef.current?.has(appId)
      ) {
        stableApps.push(appId);
      }
    });

    // Add stable apps immediately without animation
    if (stableApps.length > 0) {
      setVisibleApps((prev) => {
        const next = new Set(prev);
        stableApps.forEach((appId) => next.add(appId));
        return next;
      });
      setAnimationStates((prev) => {
        const next = { ...prev };
        stableApps.forEach((appId) => {
          next[appId] = "stable";
        });
        return next;
      });
    }

    // Find apps that are entering (new apps not in visible set)
    // Exclude apps that existed on initial mount - they were handled above as stable
    const enteringApps: string[] = [];
    currentApps.forEach((appId) => {
      if (
        !visibleApps.has(appId) &&
        !exitingAppsRef.current.has(appId) &&
        !initialAppsRef.current?.has(appId)
      ) {
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
        }, 700);
      }

      // After animation, remove exiting apps from visible set
      if (exitingApps.length > 0) {
        setTimeout(() => {
          setVisibleApps((prev) => {
            const next = new Set(prev);
            exitingApps.forEach((appId) => {
              next.delete(appId);
              exitingAppsRef.current.delete(appId);
              // Also remove from initialAppsRef so app will animate when reopened
              initialAppsRef.current?.delete(appId);
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
        }, 350);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visibleApps is a Set; we track changes via currentAppsKey
  }, [currentAppsKey]);

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
  // Render apps that should currently show OR are still in visibleApps (animating out)
  // Using visibleApps instead of animationStates avoids a one-frame flicker where the
  // app would disappear before the useEffect sets the "exiting" state
  const currentAppsSet = new Set(currentAppsToShow);
  const appsToRender = APPS.filter(
    (app) => currentAppsSet.has(app.id) || visibleApps.has(app.id)
  );

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
                {app.id === "calendar" ? (
                  <CalendarDockIcon size={48} />
                ) : (
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={48}
                    height={48}
                    className="rounded-xl shadow-md"
                  />
                )}
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
