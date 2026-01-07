"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { WindowFocusProvider } from "@/lib/window-focus-context";

interface WindowProps {
  appId: string;
  children: React.ReactNode;
  onFocus?: () => void; // Called when window gains focus
}

const MENU_BAR_HEIGHT = 28;
const DOCK_HEIGHT = 80;

export function Window({ appId, children, onFocus }: WindowProps) {
  const {
    getWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    minimizeWindow,
    toggleMaximize,
    state,
  } = useWindowManager();

  const windowState = getWindow(appId);
  const app = getAppById(appId);
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isFocused = state.focusedWindowId === appId;

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking on interactive elements
      if ((e.target as HTMLElement).closest(".window-controls")) {
        return;
      }
      if (windowState?.isMaximized) {
        return;
      }
      e.preventDefault();
      focusWindow(appId);
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - (windowState?.position.x ?? 0),
        y: e.clientY - (windowState?.position.y ?? 0),
      });
    },
    [appId, focusWindow, windowState?.position, windowState?.isMaximized]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate raw position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Get current window dimensions
      const windowWidth = windowState?.size.width ?? 400;
      const windowHeight = windowState?.size.height ?? 300;

      // Constrain bounds:
      // - Top: Can't go above menu bar
      // - Bottom: Keep at least 50px of window visible above dock
      // - Left/Right: Keep at least 100px of window visible on screen
      const minX = -windowWidth + 100;
      const maxX = window.innerWidth - 100;
      const minY = MENU_BAR_HEIGHT;
      const maxY = window.innerHeight - DOCK_HEIGHT - 50;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      moveWindow(appId, { x: newX, y: newY });
    },
    [isDragging, appId, moveWindow, dragOffset, windowState?.size]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
        zIndex: zIndex + 100, // Above menu bar (z-50) and dock (z-40), preserves focus order
      }
    : {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
        isMaximized ? "rounded-none" : "rounded-xl",
        isDragging && "cursor-grabbing",
        !isFocused && !isMaximized && "opacity-95"
      )}
      style={windowStyle}
      onMouseDown={() => {
        focusWindow(appId);
        onFocus?.();
      }}
    >
      {/* Content - no title bar, apps render their own nav with traffic lights */}
      <div className="flex-1 overflow-hidden">
        <WindowFocusProvider
          isFocused={isFocused}
          appId={appId}
          closeWindow={() => closeWindow(appId)}
          minimizeWindow={() => minimizeWindow(appId)}
          toggleMaximize={() => toggleMaximize(appId)}
          isMaximized={isMaximized}
          onDragStart={handleDragStart}
        >
          {children}
        </WindowFocusProvider>
      </div>
    </div>
  );
}
