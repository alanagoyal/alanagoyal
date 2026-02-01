"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WindowControls } from "@/components/window-controls";
import {
  useWindowBehavior,
  Position,
  Size,
  MENU_BAR_HEIGHT,
  DOCK_HEIGHT,
  CORNER_SIZE,
  EDGE_SIZE,
} from "@/lib/use-window-behavior";
import { MAXIMIZED_Z_INDEX, useWindowManager } from "@/lib/window-context";

interface TextEditWindowProps {
  windowId: string; // Unique window identifier for multi-window support
  filePath: string;
  content: string;
  position: Position;
  size: Size;
  zIndex: number;
  isFocused: boolean;
  isMaximized: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (position: Position) => void;
  onResize: (size: Size, position?: Position) => void;
  onContentChange: (content: string) => void;
}

export function TextEditWindow({
  windowId,
  filePath,
  content,
  position,
  size,
  zIndex,
  isFocused,
  isMaximized,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  onContentChange,
}: TextEditWindowProps) {
  // windowId is used for identification in multi-window scenarios
  void windowId;
  const windowRef = useRef<HTMLDivElement>(null);
  const fileName = filePath?.split("/").pop() || "Untitled";
  const { isMenuOpenRef } = useWindowManager();

  const { handleDragStart, handleResizeStart } = useWindowBehavior({
    position,
    size,
    minSize: { width: 400, height: 300 },
    isMaximized,
    onMove,
    onResize,
    onFocus,
  });

  // Keyboard shortcuts: Escape to unfocus, 'q' to quit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this window is focused
      if (!isFocused) return;

      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      // 'q' to close window (only when not typing)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === "q") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, onClose]);

  const windowStyle = isMaximized
    ? { top: MENU_BAR_HEIGHT, left: 0, right: 0, bottom: DOCK_HEIGHT, width: "auto", height: "auto", zIndex: MAXIMIZED_Z_INDEX }
    : { top: position.y, left: position.x, width: size.width, height: size.height, zIndex };

  return (
    <div
      ref={windowRef}
      className={cn("fixed", !isFocused && !isMaximized && "opacity-95")}
      style={windowStyle}
      onMouseDownCapture={(e) => {
        // Don't focus or propagate if menu is open
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        onFocus();
      }}
      onClickCapture={(e) => {
        // Block clicks if menu is open
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {/* Window chrome */}
      <div
        className={cn(
          "absolute inset-0 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
          isMaximized ? "rounded-none" : "rounded-xl"
        )}
      >
        {/* Title bar */}
        <div
          className="px-4 py-2 flex items-center justify-between select-none bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 cursor-default"
          onMouseDown={handleDragStart}
        >
          <WindowControls
            inShell={true}
            className="p-2 window-controls"
            onClose={onClose}
            onMinimize={onMinimize}
            onToggleMaximize={onToggleMaximize}
            isMaximized={isMaximized}
            closeLabel="Close window"
          />
          <div className="flex-1 text-center">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">{fileName}</span>
          </div>
          <div className="w-[68px]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full bg-transparent resize-none outline-none font-mono text-sm leading-relaxed p-4 overflow-auto text-zinc-900 dark:text-white"
            placeholder="Start typing..."
            spellCheck={false}
          />
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
            className="absolute cursor-w-resize"
            style={{ left: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute cursor-e-resize"
            style={{ right: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
        </>
      )}
    </div>
  );
}
