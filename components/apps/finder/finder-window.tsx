"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { FinderApp } from "./finder-app";
import { WindowFocusProvider } from "@/lib/window-focus-context";
import { MAXIMIZED_Z_INDEX, useWindowManager } from "@/lib/window-context";
import {
  useWindowBehavior,
  Position,
  Size,
  CORNER_SIZE,
  EDGE_SIZE,
} from "@/lib/use-window-behavior";

interface FinderWindowProps {
  windowId: string;
  initialPath?: string;
  position: Position;
  size: Size;
  zIndex: number;
  isFocused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (position: Position) => void;
  onResize: (size: Size, position?: Position) => void;
  onPathChange: (path: string) => void;
  onOpenApp?: (appId: string) => void;
  onOpenTextFile?: (filePath: string, content: string) => void;
  onOpenPreviewFile?: (filePath: string, fileUrl: string, fileType: "image" | "pdf") => void;
}

export function FinderWindow({
  windowId,
  initialPath,
  position,
  size,
  zIndex,
  isFocused,
  isMinimized,
  isMaximized,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  onPathChange,
  onOpenApp,
  onOpenTextFile,
  onOpenPreviewFile,
}: FinderWindowProps) {
  void windowId;
  const windowRef = useRef<HTMLDivElement>(null);
  const innerWrapperRef = useRef<HTMLDivElement>(null);
  const { isMenuOpenRef } = useWindowManager();
  const wasFocusedBeforeMouseDown = useRef(true);
  const suppressDoubleClickUntil = useRef(0);

  const { isInteracting, handleDragStart, handleResizeStart } = useWindowBehavior({
    position,
    size,
    minSize: { width: 600, height: 400 },
    isMaximized,
    onMove,
    onResize,
    onFocus,
    windowRef,
  });

  const isHiddenMinimized = isMinimized;
  const windowStyle: React.CSSProperties = isHiddenMinimized
    ? { width: 0, height: 0, overflow: "hidden" }
    : isMaximized
      ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "auto",
          height: "auto",
          zIndex: MAXIMIZED_Z_INDEX,
        }
      : {
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: size.width,
          height: size.height,
          zIndex,
          willChange: isInteracting ? "transform,width,height" : undefined,
        };

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed",
        isHiddenMinimized && "invisible pointer-events-none",
        !isFocused && !isMaximized && !isHiddenMinimized && "opacity-95",
      )}
      style={windowStyle}
      aria-hidden={isHiddenMinimized || undefined}
      onMouseDownCapture={(e) => {
        if (isHiddenMinimized) return;
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        const wasAlreadyFocused = isFocused;
        wasFocusedBeforeMouseDown.current = wasAlreadyFocused;
        onFocus();

        const isResizeHandle = (e.target as HTMLElement).closest("[data-window-resize-handle='true']");
        if (!wasAlreadyFocused && !isResizeHandle) {
          e.stopPropagation();
          e.preventDefault();
          suppressDoubleClickUntil.current = performance.now() + 500;
        }
      }}
      onClickCapture={(e) => {
        if (isHiddenMinimized) return;
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (!wasFocusedBeforeMouseDown.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onDoubleClickCapture={(e) => {
        if (isHiddenMinimized) return;
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (performance.now() < suppressDoubleClickUntil.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div
        ref={innerWrapperRef}
        className={cn(
          "absolute inset-0 overflow-hidden shadow-2xl flex flex-col bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10",
          isMaximized ? "rounded-none" : "rounded-xl",
          !isFocused && "[&_*]:!cursor-default"
        )}
      >
        <div className="flex-1 min-h-0">
          <WindowFocusProvider
            isFocused={!isHiddenMinimized && isFocused}
            appId="finder"
            closeWindow={onClose}
            minimizeWindow={onMinimize}
            toggleMaximize={onToggleMaximize}
            isMaximized={isMaximized}
            onDragStart={handleDragStart}
            dialogContainerRef={innerWrapperRef}
          >
            <FinderApp
              inShell={true}
              initialPath={initialPath}
              onPathChange={onPathChange}
              onOpenApp={onOpenApp}
              onOpenTextFile={onOpenTextFile}
              onOpenPreviewFile={onOpenPreviewFile}
            />
          </WindowFocusProvider>
        </div>
      </div>

      {!isMaximized && !isHiddenMinimized && (
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
}
