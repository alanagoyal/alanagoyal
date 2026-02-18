"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { APPS, getAppById } from "@/lib/app-config";
import { useWindowManager } from "@/lib/window-context";
import { cn } from "@/lib/utils";
import { CalendarDockIcon } from "@/components/apps/calendar/calendar-dock-icon";

interface DockProps {
  onTrashClick?: () => void;
  onFinderClick?: () => void;
  appBadges?: Record<string, number>;
  initialVisibleAppIds?: string[];
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

function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

const DOCK_SCALE_STORAGE_KEY = "desktopDockDesiredScale";
const DOCK_MIN_DESIRED_SCALE = 0.7;
const DOCK_MAX_DESIRED_SCALE = 1.6;
const DOCK_DEFAULT_SCALE = 1;
const DOCK_SCALE_STEP = 0.05;
const DOCK_DRAG_PIXELS_PER_SCALE = 220;

const BASE_ICON_SIZE = 48;
const BASE_GAP = 4;
const BASE_PADDING_X = 12;
const BASE_PADDING_Y = 6;
const BASE_DIVIDER_WIDTH = 1;
const BASE_DIVIDER_MARGIN_X = 4;
const BASE_DIVIDER_HEIGHT = 48;
const BASE_DOT_SIZE = 4;
const BASE_BADGE_HEIGHT = 20;
const BASE_BADGE_MIN_WIDTH = 20;
const BASE_BADGE_PADDING_X = 4;
const BASE_BADGE_FONT_SIZE = 11;
const BASE_TRASH_HANDLE_HITBOX_WIDTH = 14;
const BASE_HANDLE_LINE_WIDTH = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundScale(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getInitialDockScale(): number {
  if (typeof window === "undefined") return DOCK_DEFAULT_SCALE;
  const raw = window.sessionStorage.getItem(DOCK_SCALE_STORAGE_KEY);
  if (!raw) return DOCK_DEFAULT_SCALE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DOCK_DEFAULT_SCALE;
  return clamp(parsed, DOCK_MIN_DESIRED_SCALE, DOCK_MAX_DESIRED_SCALE);
}

export function Dock({
  onTrashClick,
  onFinderClick,
  appBadges = {},
  initialVisibleAppIds = [],
}: DockProps) {
  const {
    openWindow,
    focusWindow,
    unminimizeWindow,
    getWindow,
    hasOpenWindows,
    bringAppToFront,
  } = useWindowManager();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [desiredScale, setDesiredScale] = useState(getInitialDockScale);
  const [isResizingDock, setIsResizingDock] = useState(false);
  const dragStateRef = useRef<{ pointerId: number; startY: number; startScale: number } | null>(null);
  const previousUserSelectRef = useRef<string | null>(null);
  const previousCursorRef = useRef<string | null>(null);

  const initialVisibleAppIdSet = useMemo(() => {
    const validIds = new Set(APPS.map((app) => app.id));
    return new Set(initialVisibleAppIds.filter((id) => validIds.has(id)));
  }, [initialVisibleAppIds]);

  // Track temporary startup visibility for deep-linked non-dock apps.
  // Once those apps actually open, this set is cleared so normal close behavior resumes.
  const [startupVisibleApps, setStartupVisibleApps] = useState<Set<string>>(
    () => new Set(initialVisibleAppIdSet)
  );

  // Track which apps are visible and their animation states.
  // Initialize with default dock apps + startup-visible apps so they don't animate on first paint.
  const initialDockApps = useMemo(() => {
    const dockApps = new Set(getDefaultDockApps());
    initialVisibleAppIdSet.forEach((appId) => dockApps.add(appId));
    return dockApps;
  }, [initialVisibleAppIdSet]);

  const [visibleApps, setVisibleApps] = useState<Set<string>>(
    () => new Set(initialDockApps)
  );
  const [animationStates, setAnimationStates] = useState<Record<string, AnimationState>>(() => {
    const states: Record<string, AnimationState> = {};
    initialDockApps.forEach((appId) => {
      states[appId] = "stable";
    });
    return states;
  });
  const exitingAppsRef = useRef<Set<string>>(new Set());

  // Track apps that existed on initial mount - these skip enter animation on first appearance
  // but will animate if closed and reopened (removed from this set on exit)
  const initialAppsRef = useRef<Set<string> | null>(null);

  const currentAppsToShow = APPS.filter((app) => {
    const showByDefault = app.showOnDockByDefault !== false;
    return showByDefault || hasOpenWindows(app.id) || startupVisibleApps.has(app.id);
  }).map((app) => app.id);

  // Serialize for stable dependency comparison
  const currentAppsKey = currentAppsToShow.join(",");

  useEffect(() => {
    setStartupVisibleApps((prev) => {
      let changed = false;
      const next = new Set(prev);
      prev.forEach((appId) => {
        if (hasOpenWindows(appId)) {
          next.delete(appId);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [hasOpenWindows, currentAppsKey]);

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
        unminimizeWindow(appId);
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

  const effectiveScale = useMemo(
    () => roundScale(clamp(desiredScale, DOCK_MIN_DESIRED_SCALE, DOCK_MAX_DESIRED_SCALE)),
    [desiredScale]
  );

  const metrics = useMemo(() => {
    const scale = effectiveScale;
    return {
      icon: Math.max(30, Math.round(BASE_ICON_SIZE * scale)),
      gap: Math.max(2, Math.round(BASE_GAP * scale)),
      padX: Math.max(8, Math.round(BASE_PADDING_X * scale)),
      padY: Math.max(4, Math.round(BASE_PADDING_Y * scale)),
      dividerWidth: Math.max(1, Math.round(BASE_DIVIDER_WIDTH * scale)),
      dividerHeight: Math.max(30, Math.round(BASE_DIVIDER_HEIGHT * scale)),
      dividerMarginX: Math.max(2, Math.round(BASE_DIVIDER_MARGIN_X * scale)),
      dot: Math.max(2, Math.round(BASE_DOT_SIZE * scale)),
      badgeHeight: Math.max(14, Math.round(BASE_BADGE_HEIGHT * scale)),
      badgeMinWidth: Math.max(14, Math.round(BASE_BADGE_MIN_WIDTH * scale)),
      badgePaddingX: Math.max(2, Math.round(BASE_BADGE_PADDING_X * scale)),
      badgeFontSize: Math.max(9, Math.round(BASE_BADGE_FONT_SIZE * scale)),
      handleHitboxWidth: Math.max(10, Math.round(BASE_TRASH_HANDLE_HITBOX_WIDTH * scale)),
      handleLineWidth: Math.max(1, Math.round(BASE_HANDLE_LINE_WIDTH * scale)),
    };
  }, [effectiveScale]);

  const endDockResize = useCallback(() => {
    dragStateRef.current = null;
    setIsResizingDock(false);
    if (typeof document !== "undefined") {
      if (previousUserSelectRef.current !== null) {
        document.body.style.userSelect = previousUserSelectRef.current;
      } else {
        document.body.style.removeProperty("user-select");
      }
      if (previousCursorRef.current !== null) {
        document.body.style.cursor = previousCursorRef.current;
      } else {
        document.body.style.removeProperty("cursor");
      }
    }
  }, []);

  const updateDesiredScale = useCallback((next: number) => {
    const bounded = roundScale(clamp(next, DOCK_MIN_DESIRED_SCALE, DOCK_MAX_DESIRED_SCALE));
    setDesiredScale(bounded);
  }, []);

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startScale: desiredScale,
      };
      previousUserSelectRef.current = document.body.style.userSelect;
      previousCursorRef.current = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
      setIsResizingDock(true);
    },
    [desiredScale]
  );

  const handleResizePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const viewportHeight = window.innerHeight;
    if (event.clientY >= viewportHeight - 1) {
      updateDesiredScale(DOCK_MIN_DESIRED_SCALE);
      return;
    }
    if (event.clientY <= 1) {
      updateDesiredScale(DOCK_MAX_DESIRED_SCALE);
      return;
    }
    const deltaY = drag.startY - event.clientY;
    const scaleDelta = deltaY / DOCK_DRAG_PIXELS_PER_SCALE;
    updateDesiredScale(drag.startScale + scaleDelta);
  }, [updateDesiredScale]);

  const handleResizePointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    }
    endDockResize();
  }, [endDockResize]);

  const handleResizePointerCancel = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    endDockResize();
  }, [endDockResize]);

  const handleResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      updateDesiredScale(desiredScale + DOCK_SCALE_STEP);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      updateDesiredScale(desiredScale - DOCK_SCALE_STEP);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      updateDesiredScale(DOCK_MIN_DESIRED_SCALE);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      updateDesiredScale(DOCK_MAX_DESIRED_SCALE);
    }
  }, [desiredScale, updateDesiredScale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(DOCK_SCALE_STORAGE_KEY, String(desiredScale));
  }, [desiredScale]);

  useEffect(() => {
    if (!isResizingDock || typeof window === "undefined") return;
    const forceEndResize = () => {
      endDockResize();
    };
    window.addEventListener("pointerup", forceEndResize);
    window.addEventListener("pointercancel", forceEndResize);
    window.addEventListener("blur", forceEndResize);
    return () => {
      window.removeEventListener("pointerup", forceEndResize);
      window.removeEventListener("pointercancel", forceEndResize);
      window.removeEventListener("blur", forceEndResize);
    };
  }, [isResizingDock, endDockResize]);

  useEffect(() => {
    return () => {
      endDockResize();
    };
  }, [endDockResize]);

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60]">
      <div
        className={cn(
          "flex items-end bg-white/30 dark:bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/10 dark:border-white/10 shadow-lg w-max",
          isResizingDock ? "transition-none" : "transition-all duration-300"
        )}
        style={{
          gap: `${metrics.gap}px`,
          padding: `${metrics.padY}px ${metrics.padX}px`,
        }}
      >
        {appsToRender.map((app) => {
          const isOpen = hasOpenWindows(app.id);
          const animState = animationStates[app.id] || "stable";
          const badgeCount = appBadges[app.id] ?? 0;

          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              className={cn(
                "group relative flex flex-col items-center outline-none transition-all duration-300 flex-shrink-0",
                animState === "entering" && "animate-dock-enter",
                animState === "exiting" && "animate-dock-exit",
                animState === "stable" && "hover:scale-110 active:scale-95"
              )}
            >
              {hoveredApp === app.id && animState === "stable" && !isResizingDock && (
                <DockTooltip label={app.name} />
              )}
              <div
                className="relative flex items-center justify-center"
                style={{ width: `${metrics.icon}px`, height: `${metrics.icon}px` }}
              >
                {app.id === "calendar" ? (
                  <CalendarDockIcon size={Math.round(metrics.icon * 0.79)} />
                ) : (
                  <img
                    src={app.icon}
                    alt={app.name}
                    width={metrics.icon}
                    height={metrics.icon}
                    className="object-contain [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.35))] pointer-events-none"
                    draggable={false}
                  />
                )}
                {badgeCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white font-semibold leading-none flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
                    style={{
                      minWidth: `${metrics.badgeMinWidth}px`,
                      height: `${metrics.badgeHeight}px`,
                      paddingLeft: `${metrics.badgePaddingX}px`,
                      paddingRight: `${metrics.badgePaddingX}px`,
                      fontSize: `${metrics.badgeFontSize}px`,
                    }}
                  >
                    {formatBadgeCount(badgeCount)}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "rounded-full mt-1 transition-opacity",
                  // Finder always shows dot (can be closed but not quit)
                  isOpen || app.id === "finder"
                    ? "bg-black/60 dark:bg-white/60 opacity-100"
                    : "opacity-0"
                )}
                style={{ width: `${metrics.dot}px`, height: `${metrics.dot}px` }}
              />
            </button>
          );
        })}
        {/* Resize handle before Trash */}
        <button
          type="button"
          aria-label="Resize Dock"
          title="Resize Dock"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerCancel}
          onLostPointerCapture={endDockResize}
          onKeyDown={handleResizeKeyDown}
          onMouseEnter={() => setHoveredApp(null)}
          className="relative self-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
          style={{
            width: `${metrics.handleHitboxWidth}px`,
            height: `${metrics.dividerHeight + 8}px`,
            marginLeft: `${metrics.dividerMarginX}px`,
            marginRight: `${metrics.dividerMarginX}px`,
            cursor: "ns-resize",
            touchAction: "none",
          }}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/20 dark:bg-white/10 rounded-full",
              isResizingDock && "bg-black/35 dark:bg-white/30"
            )}
            style={{
              width: `${metrics.handleLineWidth}px`,
              height: `${metrics.dividerHeight}px`,
            }}
          />
        </button>

        {/* Trash icon */}
        <button
          onClick={handleTrashClick}
          onMouseEnter={() => setHoveredApp("trash")}
          onMouseLeave={() => setHoveredApp(null)}
          className="group relative flex flex-col items-center transition-transform hover:scale-110 active:scale-95 outline-none flex-shrink-0"
        >
          {hoveredApp === "trash" && !isResizingDock && <DockTooltip label="Trash" />}
          <div
            className="relative flex items-center justify-center"
            style={{ width: `${metrics.icon}px`, height: `${metrics.icon}px` }}
          >
            <img
              src="/trash.png"
              alt="Trash"
              width={metrics.icon}
              height={metrics.icon}
              className="object-contain [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.35))] pointer-events-none"
              draggable={false}
            />
          </div>
          {/* Trash doesn't show open indicator */}
          <div className="rounded-full mt-1 opacity-0" style={{ width: `${metrics.dot}px`, height: `${metrics.dot}px` }} />
        </button>
      </div>
    </div>
  );
}
