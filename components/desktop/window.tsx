"use client";

import { useRef, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWindowManager, MAXIMIZED_Z_INDEX } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import type { Position, Size, WindowState } from "@/types/window";
import { cn } from "@/lib/utils";
import { WindowFocusProvider } from "@/lib/window-focus-context";
import {
  getDockThumbnailContainer,
  subscribeDockThumbnail,
} from "@/lib/desktop/dock-thumbnails";
import {
  useWindowBehavior,
  CORNER_SIZE,
  DOCK_HEIGHT,
  EDGE_SIZE,
  MENU_BAR_HEIGHT,
} from "@/lib/use-window-behavior";

interface ControlledWindowHandlers {
  closeWindow: () => void;
  focusWindow: () => void;
  moveWindow: (position: Position) => void;
  resizeWindow: (size: Size, position?: Position) => void;
  minimizeWindow: () => void;
  toggleMaximize: () => void;
}

interface WindowProps {
  appId: string;
  children: React.ReactNode;
  onFocus?: () => void;
  zIndexOverride?: number;
  keepMountedWhenMinimized?: boolean;
  windowStateOverride?: WindowState;
  controlledHandlers?: ControlledWindowHandlers;
}

// Minimize/restore flight, mirroring the macOS scale effect: the window
// shrinks into its Dock thumbnail slot and grows back out on restore.
type FlightTransform = { tx: number; ty: number; scale: number };
type MinimizePhase = "normal" | "shrinking" | "docked" | "expanding";

const MINIMIZE_FLIGHT_MS = 320;
const FLIGHT_SETTLE_MS = 80;
const SHRINK_TRANSITION = `transform ${MINIMIZE_FLIGHT_MS}ms cubic-bezier(0.4, 0, 1, 1)`;
const EXPAND_TRANSITION = `transform ${MINIMIZE_FLIGHT_MS}ms cubic-bezier(0, 0, 0.2, 1)`;

export function Window({
  appId,
  children,
  onFocus,
  zIndexOverride,
  keepMountedWhenMinimized = false,
  windowStateOverride,
  controlledHandlers,
}: WindowProps) {
  const {
    getWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    toggleMaximize,
    state,
    isMenuOpenRef,
  } = useWindowManager();

  const windowState = windowStateOverride ?? getWindow(appId);
  const app = getAppById(appId);
  const windowRef = useRef<HTMLDivElement>(null);
  const innerWrapperRef = useRef<HTMLDivElement>(null);

  const isFocused = state.focusedWindowId === windowState?.id;
  const usesTransformPositioning = appId !== "messages";
  const isBorderlessWindow = appId === "weather";

  // Track if window was focused before current interaction
  // Used to implement "click-to-focus" - first click only focuses, doesn't trigger actions
  const wasFocusedBeforeMouseDown = useRef(true);
  // Track recently consumed focus-transfer clicks so dblclick handlers don't fire.
  const suppressDoubleClickUntil = useRef(0);
  const titleBarRestoreFrameRef = useRef<{ position: Position; size: Size } | null>(null);

  useEffect(() => {
    if (windowState?.isMaximized) {
      titleBarRestoreFrameRef.current = null;
    }
  }, [windowState?.isMaximized]);

  // When minimized, the window's live tree portals into its Dock thumbnail
  // container so the thumbnail mirrors the real window content. The container
  // appears once the Dock renders the thumbnail; until then the previous
  // minimize behavior (hidden mount or unmount) applies.
  const [thumbnailContainer, setThumbnailContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const minimized = windowState?.isMinimized;
    const windowId = windowState?.id;
    if (!minimized || !windowId) {
      setThumbnailContainer(null);
      return;
    }
    const update = (container: HTMLElement | null) => setThumbnailContainer(container);
    update(getDockThumbnailContainer(windowId));
    return subscribeDockThumbnail(windowId, update);
  }, [windowState?.isMinimized, windowState?.id]);

  // --- Minimize/restore flight (macOS scale effect) ---
  // Phases: normal → shrinking (desktop window animates into the Dock slot)
  // → docked (live portal thumbnail) → expanding (desktop window animates out
  // of the Dock slot) → normal. Windows already minimized at mount (session
  // restore) dock directly without a flight.
  const [minimizePhase, setMinimizePhase] = useState<MinimizePhase>("normal");
  const [shrinkTarget, setShrinkTarget] = useState<FlightTransform | null>(null);
  const [expandReady, setExpandReady] = useState(false);
  const lastThumbMetricsRef = useRef<{
    cx: number;
    cy: number;
    w: number;
    h: number;
  } | null>(null);
  const flightTimerRef = useRef<number | null>(null);
  const initialMinimizedRef = useRef<boolean | null>(null);

  // A minimized window rendered as a Dock thumbnail must be fully inert:
  // no pointer events, no tab focus into the scaled content, and removed
  // from the accessibility tree (the thumbnail button carries the semantics).
  const isMinimizedWithThumbnail =
    windowState?.isMinimized === true && thumbnailContainer !== null;
  useEffect(() => {
    const element = windowRef.current;
    if (!element) return;
    if (isMinimizedWithThumbnail) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
    // Re-run across minimize phases: the DOM root is recreated when the
    // window moves between the desktop and the Dock portal, and the new
    // root must get (or drop) inert accordingly.
  }, [isMinimizedWithThumbnail, minimizePhase]);


  if (windowState && initialMinimizedRef.current === null) {
    initialMinimizedRef.current = windowState.isMinimized;
  }
  {
    const minimized = windowState?.isMinimized ?? false;
    const open = windowState?.isOpen ?? false;
    if (!open) {
      // A closed window resets its flight bookkeeping; the next open starts clean.
      initialMinimizedRef.current = false;
      if (minimizePhase !== "normal") {
        setMinimizePhase("normal");
        setShrinkTarget(null);
        setExpandReady(false);
      }
    } else if (minimized) {
      if (initialMinimizedRef.current === true && minimizePhase === "normal") {
        // Minimized before this mount (session restore): dock without a flight.
        initialMinimizedRef.current = false;
        setMinimizePhase("docked");
      } else if (
        initialMinimizedRef.current === false &&
        (minimizePhase === "normal" || minimizePhase === "expanding")
      ) {
        setMinimizePhase("shrinking");
        setShrinkTarget(null);
        setExpandReady(false);
      }
    } else if (minimizePhase === "docked" || minimizePhase === "shrinking") {
      setMinimizePhase("expanding");
      setShrinkTarget(null);
      setExpandReady(false);
    }
  }

  useEffect(() => {
    if (minimizePhase === "shrinking") {
      // Double rAF guarantees the full-size position paints before the
      // shrink transition starts, so the flight always animates from rest.
      let cancelled = false;
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        if (cancelled) return;
        raf2 = window.requestAnimationFrame(() => {
          if (cancelled) return;
          const windowId = windowState?.id;
          const container = windowId ? getDockThumbnailContainer(windowId) : null;
          const element = windowRef.current;
          if (!container || !element) {
            // No thumbnail slot to fly into; dock (or hide) immediately.
            setMinimizePhase("docked");
            return;
          }
          const cRect = container.getBoundingClientRect();
          const wRect = element.getBoundingClientRect();
          if (wRect.width <= 0 || wRect.height <= 0) {
            setMinimizePhase("docked");
            return;
          }
          const scale = Math.max(
            Math.min(cRect.width / wRect.width, cRect.height / wRect.height),
            0.01
          );
          setShrinkTarget({
            tx: cRect.left + cRect.width / 2 - (wRect.left + wRect.width / 2),
            ty: cRect.top + cRect.height / 2 - (wRect.top + wRect.height / 2),
            scale,
          });
        });
      });
      flightTimerRef.current = window.setTimeout(() => {
        flightTimerRef.current = null;
        setMinimizePhase("docked");
        setShrinkTarget(null);
      }, MINIMIZE_FLIGHT_MS + FLIGHT_SETTLE_MS);
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
        if (flightTimerRef.current !== null) {
          window.clearTimeout(flightTimerRef.current);
          flightTimerRef.current = null;
        }
      };
    }
    if (minimizePhase === "expanding") {
      // Paint the shrunken start position first, then expand with a transition.
      let cancelled = false;
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        if (cancelled) return;
        raf2 = window.requestAnimationFrame(() => {
          if (cancelled) return;
          setExpandReady(true);
        });
      });
      flightTimerRef.current = window.setTimeout(() => {
        flightTimerRef.current = null;
        setMinimizePhase("normal");
        setExpandReady(false);
      }, MINIMIZE_FLIGHT_MS + FLIGHT_SETTLE_MS);
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
        if (flightTimerRef.current !== null) {
          window.clearTimeout(flightTimerRef.current);
          flightTimerRef.current = null;
        }
      };
    }
  }, [minimizePhase, windowState?.id]);

  // Remember the Dock thumbnail geometry while docked so the restore flight
  // can start from the slot even though the container unmounts on restore.
  useLayoutEffect(() => {
    if (minimizePhase !== "docked" || !thumbnailContainer) return;
    const capture = () => {
      const rect = thumbnailContainer.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        lastThumbMetricsRef.current = {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
        };
      }
    };
    capture();
    const observer = new ResizeObserver(capture);
    observer.observe(thumbnailContainer);
    return () => observer.disconnect();
  }, [minimizePhase, thumbnailContainer]);

  // Wrap WindowManager callbacks for the hook
  const handleMove = useCallback(
    (position: Position) => {
      if (controlledHandlers) {
        controlledHandlers.moveWindow(position);
        return;
      }
      moveWindow(appId, position);
    },
    [appId, moveWindow, controlledHandlers]
  );

  const handleResize = useCallback(
    (size: Size, position?: Position) => {
      if (controlledHandlers) {
        controlledHandlers.resizeWindow(size, position);
        return;
      }
      resizeWindow(appId, size, position);
    },
    [appId, resizeWindow, controlledHandlers]
  );

  const handleFocus = useCallback(() => {
    if (controlledHandlers) {
      controlledHandlers.focusWindow();
      return;
    }
    focusWindow(appId);
  }, [appId, focusWindow, controlledHandlers]);

  const { isInteracting, handleDragStart, handleResizeStart } = useWindowBehavior({
    position: windowState?.position ?? { x: 0, y: 0 },
    size: windowState?.size ?? { width: 400, height: 300 },
    minSize: app?.minSize ?? { width: 200, height: 150 },
    isMaximized: windowState?.isMaximized ?? false,
    onMove: handleMove,
    onResize: handleResize,
    onFocus: handleFocus,
    windowRef,
    positionMode: usesTransformPositioning ? "transform" : "top-left",
  });

  if (!windowState || !windowState.isOpen || !app) {
    return null;
  }

  if (
    windowState.isMinimized &&
    !keepMountedWhenMinimized &&
    !thumbnailContainer &&
    minimizePhase !== "shrinking"
  ) {
    return null;
  }

  // When minimized with keepMountedWhenMinimized, we render the SAME tree
  // structure but hidden via CSS. This preserves React's component identity
  // so children (e.g. Messages and its MessageQueue) are never unmounted.
  // A window mid-flight (shrinking into or expanding out of the Dock) keeps
  // rendering on the desktop so the scale animation can play.
  const isDockThumbnail =
    windowState.isMinimized &&
    minimizePhase === "docked" &&
    thumbnailContainer !== null;
  const isFlightActive =
    minimizePhase === "shrinking" || minimizePhase === "expanding";
  const isHiddenMinimized =
    windowState.isMinimized &&
    !isDockThumbnail &&
    !isFlightActive &&
    keepMountedWhenMinimized;

  const { position, size, isMaximized, zIndex } = windowState;

  // Base layout box for flight transforms: maximized windows fill the
  // viewport (inset positioning), everything else uses its stored frame.
  const flightBaseLeft = isMaximized ? 0 : position.x;
  const flightBaseTop = isMaximized ? 0 : position.y;
  const flightTransformFor = (flight: FlightTransform): string =>
    usesTransformPositioning
      ? `translate(${flightBaseLeft + flight.tx}px, ${flightBaseTop +
          flight.ty}px) scale(${flight.scale})`
      : `translate(${flight.tx}px, ${flight.ty}px) scale(${flight.scale})`;

  // Restore flights start from the last known Dock slot geometry.
  let expandFrom: FlightTransform | null = null;
  if (minimizePhase === "expanding" && !expandReady) {
    const metrics = lastThumbMetricsRef.current;
    const baseWidth = isMaximized && typeof window !== "undefined" ? window.innerWidth : size.width;
    const baseHeight = isMaximized && typeof window !== "undefined" ? window.innerHeight : size.height;
    if (metrics && baseWidth > 0 && baseHeight > 0) {
      const scale = Math.max(Math.min(metrics.w / baseWidth, metrics.h / baseHeight), 0.01);
      expandFrom = {
        tx: metrics.cx - (flightBaseLeft + baseWidth / 2),
        ty: metrics.cy - (flightBaseTop + baseHeight / 2),
        scale,
      };
    }
  }

  const normalStyle: React.CSSProperties = isHiddenMinimized
    ? { width: 0, height: 0, overflow: "hidden" }
    : isMaximized
      ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "auto",
          height: "auto",
          zIndex: zIndexOverride ?? MAXIMIZED_Z_INDEX,
        }
      : {
          ...(usesTransformPositioning
            ? { transform: `translate(${position.x}px, ${position.y}px)` }
            : { top: position.y, left: position.x }),
          width: size.width,
          height: size.height,
          zIndex: zIndexOverride ?? zIndex,
          willChange: isInteracting
            ? usesTransformPositioning
              ? "transform,width,height"
              : "top,left,width,height"
            : undefined,
        };

  let windowStyle: React.CSSProperties;
  if (isDockThumbnail) {
    windowStyle = {
      // Scaled live mirror inside the Dock thumbnail container. The Dock
      // sets --dock-thumb-scale from the thumbnail and window dimensions.
      width: size.width,
      height: size.height,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) scale(var(--dock-thumb-scale, 1))",
      transformOrigin: "center",
    };
  } else if (minimizePhase === "shrinking" && shrinkTarget) {
    // Shrink into the Dock slot (macOS scale minimize).
    windowStyle = {
      ...normalStyle,
      transform: flightTransformFor(shrinkTarget),
      transition: SHRINK_TRANSITION,
      willChange: "transform",
    };
  } else if (minimizePhase === "expanding" && !expandReady && expandFrom) {
    // First expanding paint: start shrunken at the Dock slot, no transition.
    windowStyle = {
      ...normalStyle,
      transform: flightTransformFor(expandFrom),
      willChange: "transform",
    };
  } else if (minimizePhase === "expanding" && expandReady) {
    // Expand back to the resting frame.
    windowStyle = {
      ...normalStyle,
      transition: EXPAND_TRANSITION,
      willChange: "transform",
    };
  } else {
    windowStyle = normalStyle;
  }

  const windowNode = (
    <div
      ref={windowRef}
      className={cn(
        isDockThumbnail ? "absolute pointer-events-none" : "fixed",
        isHiddenMinimized && "invisible pointer-events-none",
        isFlightActive && "pointer-events-none",
        !isFocused &&
          !isMaximized &&
          !isHiddenMinimized &&
          !isDockThumbnail &&
          !isFlightActive &&
          "opacity-95",
      )}
      style={windowStyle}
      aria-hidden={isHiddenMinimized || isDockThumbnail || undefined}
      onMouseDownCapture={(e) => {
        if (isHiddenMinimized) return;
        // Don't focus window or propagate click if a menu bar dropdown is open
        // (clicking outside the menu should only close the menu, not trigger any window actions)
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        // Capture mousedown before it reaches children
        const wasAlreadyFocused = isFocused;
        wasFocusedBeforeMouseDown.current = wasAlreadyFocused;

        // Always focus the window
        handleFocus();
        onFocus?.();

        // If window wasn't focused, don't let the event reach children
        // Exception: window controls and resize handles should always work
        if (!wasAlreadyFocused) {
          const isWindowControl = (e.target as HTMLElement).closest(".window-controls");
          const isResizeHandle = (e.target as HTMLElement).closest("[data-window-resize-handle='true']");
          if (!isWindowControl && !isResizeHandle) {
            e.stopPropagation();
            e.preventDefault();
            suppressDoubleClickUntil.current = performance.now() + 500;
          }
        }
      }}
      onClickCapture={(e) => {
        if (isHiddenMinimized) return;
        // Block all clicks if menu is open
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        // Also capture click events for any handlers that use onClick instead of onMouseDown
        if (!wasFocusedBeforeMouseDown.current) {
          const isWindowControl = (e.target as HTMLElement).closest(".window-controls");
          if (!isWindowControl) {
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }}
      onDoubleClickCapture={(e) => {
        if (isHiddenMinimized) return;
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        const target = e.target as HTMLElement;
        const isWindowControl = target.closest(".window-controls");
        if (!isWindowControl && performance.now() < suppressDoubleClickUntil.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        const isTitleBar = target.closest("[data-window-drag-handle='true']");
        const isInteractive = target.closest(
          "a, button, input, select, textarea, [contenteditable='true'], [role='button'], [role='menuitem']",
        );
        if (isTitleBar && !isInteractive) {
          e.stopPropagation();
          e.preventDefault();

          const restoreFrame = titleBarRestoreFrameRef.current;
          if (restoreFrame) {
            titleBarRestoreFrameRef.current = null;
            handleResize(restoreFrame.size, restoreFrame.position);
            return;
          }

          if (isMaximized) {
            if (controlledHandlers) {
              controlledHandlers.toggleMaximize();
            } else {
              toggleMaximize(appId);
            }
            return;
          }

          titleBarRestoreFrameRef.current = { position, size };
          handleResize(
            {
              width: window.innerWidth,
              height: Math.max(
                app.minSize.height,
                window.innerHeight - MENU_BAR_HEIGHT - DOCK_HEIGHT,
              ),
            },
            { x: 0, y: MENU_BAR_HEIGHT },
          );
        }
      }}
    >
      <div
        ref={innerWrapperRef}
        className={cn(
          "absolute inset-0 overflow-hidden shadow-2xl flex flex-col",
          isBorderlessWindow
            ? "bg-transparent border-0"
            : "bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10",
          isMaximized ? "rounded-none" : "rounded-xl",
          !isFocused && "[&_*]:!cursor-default"
        )}
      >
        <div className="flex-1 min-h-0">
          <WindowFocusProvider
            isFocused={isHiddenMinimized || isDockThumbnail ? false : isFocused}
            appId={appId}
            closeWindow={controlledHandlers ? controlledHandlers.closeWindow : () => closeWindow(appId)}
            minimizeWindow={controlledHandlers ? controlledHandlers.minimizeWindow : () => minimizeWindow(appId)}
            toggleMaximize={controlledHandlers ? controlledHandlers.toggleMaximize : () => toggleMaximize(appId)}
            isMaximized={isMaximized}
            onDragStart={handleDragStart}
            dialogContainerRef={innerWrapperRef}
          >
            {children}
          </WindowFocusProvider>
        </div>
      </div>

      {/* Resize handles */}
      {!isMaximized && !isHiddenMinimized && !isDockThumbnail && (
        <>
          <div
            className="absolute cursor-nw-resize"
            data-window-resize-handle="true"
            style={{ top: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute cursor-ne-resize"
            data-window-resize-handle="true"
            style={{ top: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute cursor-sw-resize"
            data-window-resize-handle="true"
            style={{ bottom: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute cursor-se-resize"
            data-window-resize-handle="true"
            style={{ bottom: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div
            className="absolute cursor-n-resize"
            data-window-resize-handle="true"
            style={{ top: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute cursor-s-resize"
            data-window-resize-handle="true"
            style={{ bottom: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute cursor-e-resize"
            data-window-resize-handle="true"
            style={{ right: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            className="absolute cursor-w-resize"
            data-window-resize-handle="true"
            style={{ left: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
        </>
      )}
    </div>
  );

  // A minimized window renders its live tree into the Dock thumbnail so the
  // thumbnail is a scaled mirror of the real window, like macOS.
  if (isDockThumbnail && thumbnailContainer) {
    return createPortal(windowNode, thumbnailContainer);
  }

  return windowNode;
}
