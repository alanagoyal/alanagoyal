"use client";

import { useRef, useCallback } from "react";
import { useWindowManager, MAXIMIZED_Z_INDEX } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { WindowFocusProvider } from "@/lib/window-focus-context";
import {
  useWindowBehavior,
  CORNER_SIZE,
  EDGE_SIZE,
} from "@/lib/use-window-behavior";

interface WindowProps {
  appId: string;
  children: React.ReactNode;
  onFocus?: () => void;
  zIndexOverride?: number;
}

export function Window({ appId, children, onFocus, zIndexOverride }: WindowProps) {
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

  const windowState = getWindow(appId);
  const app = getAppById(appId);
  const windowRef = useRef<HTMLDivElement>(null);
  const innerWrapperRef = useRef<HTMLDivElement>(null);

  const isFocused = state.focusedWindowId === appId;

  // Track if window was focused before current interaction
  // Used to implement "click-to-focus" - first click only focuses, doesn't trigger actions
  const wasFocusedBeforeMouseDown = useRef(true);

  // Wrap WindowManager callbacks for the hook
  const handleMove = useCallback(
    (position: { x: number; y: number }) => moveWindow(appId, position),
    [appId, moveWindow]
  );

  const handleResize = useCallback(
    (size: { width: number; height: number }, position?: { x: number; y: number }) =>
      resizeWindow(appId, size, position),
    [appId, resizeWindow]
  );

  const handleFocus = useCallback(() => {
    focusWindow(appId);
  }, [appId, focusWindow]);

  const { handleDragStart, handleResizeStart } = useWindowBehavior({
    position: windowState?.position ?? { x: 0, y: 0 },
    size: windowState?.size ?? { width: 400, height: 300 },
    minSize: app?.minSize ?? { width: 200, height: 150 },
    isMaximized: windowState?.isMaximized ?? false,
    onMove: handleMove,
    onResize: handleResize,
    onFocus: handleFocus,
  });

  if (!windowState || !windowState.isOpen || windowState.isMinimized || !app) {
    return null;
  }

  const { position, size, isMaximized, zIndex } = windowState;

  const windowStyle: React.CSSProperties = isMaximized
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
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex: zIndexOverride ?? zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={cn("fixed", !isFocused && !isMaximized && "opacity-95")}
      style={windowStyle}
      onMouseDownCapture={(e) => {
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
        focusWindow(appId);
        onFocus?.();

        // If window wasn't focused, don't let the event reach children
        // Exception: window controls and resize handles should always work
        if (!wasAlreadyFocused) {
          const isWindowControl = (e.target as HTMLElement).closest(".window-controls");
          const isResizeHandle = (e.target as HTMLElement).closest("[class*='cursor-']");
          if (!isWindowControl && !isResizeHandle) {
            e.stopPropagation();
          }
        }
      }}
      onClickCapture={(e) => {
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
          }
        }
      }}
    >
      <div
        ref={innerWrapperRef}
        className={cn(
          "absolute inset-0 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
          isMaximized ? "rounded-none" : "rounded-xl"
        )}
      >
        <div className="flex-1 min-h-0">
          <WindowFocusProvider
            isFocused={isFocused}
            appId={appId}
            closeWindow={() => closeWindow(appId)}
            minimizeWindow={() => minimizeWindow(appId)}
            toggleMaximize={() => toggleMaximize(appId)}
            isMaximized={isMaximized}
            onDragStart={handleDragStart}
            dialogContainerRef={innerWrapperRef}
          >
            {children}
          </WindowFocusProvider>
        </div>
      </div>

      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div
            className="absolute cursor-nw-resize"
            style={{ top: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute cursor-ne-resize"
            style={{ top: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute cursor-sw-resize"
            style={{ bottom: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute cursor-se-resize"
            style={{ bottom: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div
            className="absolute cursor-n-resize"
            style={{ top: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute cursor-s-resize"
            style={{ bottom: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute cursor-e-resize"
            style={{ right: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            className="absolute cursor-w-resize"
            style={{ left: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
        </>
      )}
    </div>
  );
}
