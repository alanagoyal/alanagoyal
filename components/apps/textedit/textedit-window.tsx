"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
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
import {
  findTextMatches,
  replaceAllTextMatches,
  replaceTextMatch,
  TEXTEDIT_OPEN_FIND_EVENT,
} from "@/lib/textedit-find";

interface TextEditWindowProps {
  windowId: string; // Unique window identifier for multi-window support
  filePath: string;
  content: string;
  position: Position;
  size: Size;
  zIndex: number;
  isFocused: boolean;
  isMaximized: boolean;
  isDirty: boolean;
  wrapToPage: boolean;
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
  isDirty,
  wrapToPage,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  onContentChange,
}: TextEditWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const fileName = filePath?.split("/").pop() || "Untitled";
  const { isMenuOpenRef } = useWindowManager();
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const matches = useMemo(() => findTextMatches(content, findQuery), [content, findQuery]);

  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
      return;
    }

    setCurrentMatchIndex((index) => Math.min(index, matches.length - 1));
  }, [matches.length]);

  useEffect(() => {
    const handleOpenFind = (event: Event) => {
      const { detail } = event as CustomEvent<{ windowId?: string }>;
      if (detail.windowId !== windowId) return;

      setFindOpen(true);
      requestAnimationFrame(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      });
    };

    window.addEventListener(TEXTEDIT_OPEN_FIND_EVENT, handleOpenFind);
    return () => window.removeEventListener(TEXTEDIT_OPEN_FIND_EVENT, handleOpenFind);
  }, [windowId]);

  const selectMatch = useCallback((index: number) => {
    const match = matches[index];
    if (!match) return;

    setCurrentMatchIndex(index);
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(match.start, match.end);
  }, [matches]);

  const moveMatch = (direction: -1 | 1) => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + direction + matches.length) % matches.length;
    selectMatch(nextIndex);
  };

  const handleReplace = () => {
    const match = matches[currentMatchIndex];
    if (!match) return;

    onContentChange(replaceTextMatch(content, match, replacement));
    requestAnimationFrame(() => findInputRef.current?.focus());
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    onContentChange(replaceAllTextMatches(content, matches, replacement));
    requestAnimationFrame(() => findInputRef.current?.focus());
  };

  const closeFind = () => {
    setFindOpen(false);
    setReplaceOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const { isInteracting, handleDragStart, handleResizeStart } = useWindowBehavior({
    position,
    size,
    minSize: { width: 400, height: 300 },
    isMaximized,
    onMove,
    onResize,
    onFocus,
    windowRef,
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

  const windowStyle: React.CSSProperties = isMaximized
    ? { top: MENU_BAR_HEIGHT, left: 0, right: 0, bottom: DOCK_HEIGHT, width: "auto", height: "auto", zIndex: MAXIMIZED_Z_INDEX }
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
          isMaximized ? "rounded-none" : "rounded-xl",
          !isFocused && "[&_*]:!cursor-default"
        )}
      >
        {/* Title bar */}
        <div
          className="px-4 py-2 flex min-w-0 items-center justify-between select-none bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 cursor-default"
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
          <div className="flex-1 min-w-0 px-2 text-center">
            <span
              data-testid="textedit-document-title"
              className="block truncate text-sm text-zinc-500 dark:text-zinc-400"
            >
              {fileName}{isDirty ? " — Edited" : ""}
            </span>
          </div>
          <div className="w-[68px] shrink-0" />
        </div>

        {findOpen && (
          <div
            data-testid="textedit-find-bar"
            className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                ref={findInputRef}
                value={findQuery}
                onChange={(event) => {
                  setFindQuery(event.target.value);
                  setCurrentMatchIndex(0);
                }}
                aria-label="Find text"
                placeholder="Find"
                className="h-7 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-900"
              />
              <span aria-live="polite" className="w-[72px] shrink-0 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                {!findQuery
                  ? ""
                  : matches.length === 0
                    ? "No matches"
                    : `${currentMatchIndex + 1} of ${matches.length}`}
              </span>
              <button
                onClick={() => moveMatch(-1)}
                disabled={matches.length === 0}
                aria-label="Previous match"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md can-hover:hover:bg-zinc-200 disabled:opacity-35 dark:can-hover:hover:bg-zinc-700"
              >
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveMatch(1)}
                disabled={matches.length === 0}
                aria-label="Next match"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md can-hover:hover:bg-zinc-200 disabled:opacity-35 dark:can-hover:hover:bg-zinc-700"
              >
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <label className="flex shrink-0 items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={replaceOpen}
                  onChange={(event) => setReplaceOpen(event.target.checked)}
                  className="h-3.5 w-3.5 accent-blue-500"
                />
                Replace
              </label>
              <button
                onClick={closeFind}
                className="h-7 shrink-0 rounded-md px-2 text-xs font-medium can-hover:hover:bg-zinc-200 dark:can-hover:hover:bg-zinc-700"
              >
                Done
              </button>
            </div>

            {replaceOpen && (
              <div className="mt-2 flex min-w-0 items-center gap-2 pl-6">
                <input
                  value={replacement}
                  onChange={(event) => setReplacement(event.target.value)}
                  aria-label="Replacement text"
                  placeholder="Replace with"
                  className="h-7 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-900"
                />
                <button
                  onClick={handleReplace}
                  disabled={matches.length === 0}
                  className="h-7 shrink-0 rounded-md border border-zinc-300 bg-white px-2 text-xs can-hover:hover:bg-zinc-100 disabled:opacity-35 dark:border-zinc-600 dark:bg-zinc-900 dark:can-hover:hover:bg-zinc-700"
                >
                  Replace
                </button>
                <button
                  onClick={handleReplaceAll}
                  disabled={matches.length === 0}
                  className="h-7 shrink-0 rounded-md border border-zinc-300 bg-white px-2 text-xs can-hover:hover:bg-zinc-100 disabled:opacity-35 dark:border-zinc-600 dark:bg-zinc-900 dark:can-hover:hover:bg-zinc-700"
                >
                  All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div
          data-testid="textedit-document-area"
          data-wrap-mode={wrapToPage ? "page" : "window"}
          className={cn(
            "flex-1 min-h-0",
            wrapToPage
              ? "overflow-auto bg-zinc-200/70 p-6 dark:bg-zinc-950"
              : "overflow-hidden"
          )}
        >
          <textarea
            ref={textareaRef}
            aria-label={`Document contents for ${fileName}`}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className={cn(
              "resize-none outline-none font-mono text-sm leading-relaxed text-zinc-900 dark:text-white",
              wrapToPage
                ? "mx-auto block h-[792px] w-[612px] bg-white px-[72px] py-[72px] shadow-[0_1px_4px_rgba(0,0,0,0.24)] dark:bg-zinc-900"
                : "h-full w-full overflow-auto bg-transparent p-4"
            )}
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
