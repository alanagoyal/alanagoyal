"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { cn } from "@/lib/utils";

interface WindowProps {
  appId: string;
  children: React.ReactNode;
}

const MENU_BAR_HEIGHT = 28;
const DOCK_HEIGHT = 80;

export function Window({ appId, children }: WindowProps) {
  const {
    getWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    toggleMaximize,
    state,
  } = useWindowManager();

  const windowState = getWindow(appId);
  const app = getAppById(appId);
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isFocused = state.focusedWindowId === appId;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from title bar area
      if ((e.target as HTMLElement).closest(".window-controls")) {
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
    [appId, focusWindow, windowState?.position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      moveWindow(appId, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, appId, moveWindow, dragOffset]
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

  if (!windowState || !windowState.isOpen || !app) {
    return null;
  }

  const { position, size, isMaximized, zIndex } = windowState;

  const windowStyle: React.CSSProperties = isMaximized
    ? {
        top: MENU_BAR_HEIGHT,
        left: 0,
        right: 0,
        bottom: DOCK_HEIGHT,
        width: "auto",
        height: "auto",
        zIndex,
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
        "fixed bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
        isDragging && "cursor-grabbing",
        !isFocused && "opacity-95"
      )}
      style={windowStyle}
      onMouseDown={() => focusWindow(appId)}
    >
      {/* Title Bar */}
      <div
        className={cn(
          "h-12 flex items-center px-4 border-b border-black/5 dark:border-white/5 select-none",
          isMaximized ? "cursor-default" : "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={!isMaximized ? handleMouseDown : undefined}
      >
        {/* Traffic Lights */}
        <div className="window-controls flex items-center gap-2">
          <button
            onClick={() => closeWindow(appId)}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
            title="Close"
          >
            <span className="text-red-900 text-[10px] opacity-0 group-hover:opacity-100">
              ×
            </span>
          </button>
          <button
            className="w-3 h-3 rounded-full bg-yellow-500 opacity-50 cursor-not-allowed"
            title="Minimize (coming soon)"
            disabled
          />
          <button
            onClick={() => toggleMaximize(appId)}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <span className="text-green-900 text-[8px] opacity-0 group-hover:opacity-100">
              {isMaximized ? "−" : "+"}
            </span>
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-black/80 dark:text-white/80">
            {app.name}
          </span>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-14" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
