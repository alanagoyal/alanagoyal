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

type ResizeDirection =
  | "n" | "s" | "e" | "w"
  | "ne" | "nw" | "se" | "sw"
  | null;

export function Window({ appId, children, onFocus }: WindowProps) {
  const {
    getWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    toggleMaximize,
    state,
  } = useWindowManager();

  const windowState = getWindow(appId);
  const app = getAppById(appId);
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

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
    setResizeDir(null);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (windowState?.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(appId);
      setResizeDir(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: windowState?.size.width ?? 400,
        height: windowState?.size.height ?? 300,
        posX: windowState?.position.x ?? 0,
        posY: windowState?.position.y ?? 0,
      });
    },
    [appId, focusWindow, windowState?.size, windowState?.position, windowState?.isMaximized]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeDir || !app) return;

      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const minWidth = app.minSize?.width ?? 200;
      const minHeight = app.minSize?.height ?? 150;

      // Max constraints based on screen bounds
      const maxWidth = window.innerWidth - resizeStart.posX;
      const maxHeight = window.innerHeight - DOCK_HEIGHT - resizeStart.posY;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle horizontal resize
      if (resizeDir.includes("e")) {
        // Resizing from east - clamp between min and max
        newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + dx));
      } else if (resizeDir.includes("w")) {
        // Resizing from west - size decreases as we move right (positive dx)
        const proposedWidth = resizeStart.width - dx;
        // Clamp width to min, and also don't let window go off left edge
        const maxLeftExpand = resizeStart.posX; // Can't go past x=0
        const maxWidthFromLeft = resizeStart.width + maxLeftExpand;
        newWidth = Math.max(minWidth, Math.min(maxWidthFromLeft, proposedWidth));
        // Position moves by the difference between original and new width
        newX = resizeStart.posX + (resizeStart.width - newWidth);
      }

      // Handle vertical resize
      if (resizeDir.includes("s")) {
        // Resizing from south - clamp between min and max
        newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + dy));
      } else if (resizeDir.includes("n")) {
        // Resizing from north - size decreases as we move down (positive dy)
        const proposedHeight = resizeStart.height - dy;
        // Clamp height to min, and also don't let window go above menu bar
        const maxTopExpand = resizeStart.posY - MENU_BAR_HEIGHT;
        const maxHeightFromTop = resizeStart.height + maxTopExpand;
        newHeight = Math.max(minHeight, Math.min(maxHeightFromTop, proposedHeight));
        // Position moves by the difference between original and new height
        newY = resizeStart.posY + (resizeStart.height - newHeight);
      }

      resizeWindow(appId, { width: newWidth, height: newHeight }, { x: newX, y: newY });
    },
    [resizeDir, resizeStart, app, appId, resizeWindow]
  );

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

  useEffect(() => {
    if (resizeDir) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizeDir, handleResizeMove, handleMouseUp]);

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

  // Resize handle sizes - corners are larger hit targets
  const edgeThickness = 6;
  const cornerSize = 12;

  return (
    // Outer wrapper - handles resize events, no overflow clipping
    <div
      ref={windowRef}
      className={cn(
        "fixed",
        isDragging && "cursor-grabbing",
        !isFocused && !isMaximized && "opacity-95"
      )}
      style={windowStyle}
      onMouseDown={() => {
        focusWindow(appId);
        onFocus?.();
      }}
    >
      {/* Inner wrapper - visual styling with rounded corners and overflow hidden */}
      <div
        className={cn(
          "absolute inset-0 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
          isMaximized ? "rounded-none" : "rounded-xl"
        )}
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

      {/* Resize handles - outside the overflow-hidden container */}
      {!isMaximized && (
        <>
          {/* Corner handles - positioned slightly outside for easy grabbing */}
          <div
            className="absolute cursor-nw-resize"
            style={{ top: -3, left: -3, width: cornerSize, height: cornerSize, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute cursor-ne-resize"
            style={{ top: -3, right: -3, width: cornerSize, height: cornerSize, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute cursor-sw-resize"
            style={{ bottom: -3, left: -3, width: cornerSize, height: cornerSize, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute cursor-se-resize"
            style={{ bottom: -3, right: -3, width: cornerSize, height: cornerSize, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />

          {/* Edge handles */}
          <div
            className="absolute cursor-n-resize"
            style={{ top: -3, left: cornerSize, right: cornerSize, height: edgeThickness, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute cursor-s-resize"
            style={{ bottom: -3, left: cornerSize, right: cornerSize, height: edgeThickness, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute cursor-e-resize"
            style={{ right: -3, top: cornerSize, bottom: cornerSize, width: edgeThickness, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            className="absolute cursor-w-resize"
            style={{ left: -3, top: cornerSize, bottom: cornerSize, width: edgeThickness, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
        </>
      )}
    </div>
  );
}
