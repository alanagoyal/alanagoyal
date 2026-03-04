"use client";

import type { MouseEventHandler, RefObject } from "react";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";

interface FinderNavProps {
  isDesktopShell: boolean;
  breadcrumbs: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  searchActive: boolean;
  searchQuery: string;
  showViewDropdown: boolean;
  viewMode: "icons" | "list";
  searchInputRef: RefObject<HTMLInputElement>;
  onToggleViewDropdown: () => void;
  onCloseViewDropdown: () => void;
  onSetViewMode: (mode: "icons" | "list") => void;
  onSearchQueryChange: (query: string) => void;
  onSearchActivate: () => void;
  onSearchBlur: () => void;
  onSearchClear: () => void;
}

const stopDragPropagation: MouseEventHandler<HTMLElement> = (event) => {
  event.stopPropagation();
};

export function FinderSidebarMobileNav() {
  return (
    <WindowNavShell
      isMobile={true}
      left={
        <WindowControls
          inShell={false}
          className="p-2"
        />
      }
      right={<WindowNavSpacer isMobile={true} />}
    />
  );
}

export function FinderNav({
  isDesktopShell,
  breadcrumbs,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  searchActive,
  searchQuery,
  showViewDropdown,
  viewMode,
  searchInputRef,
  onToggleViewDropdown,
  onCloseViewDropdown,
  onSetViewMode,
  onSearchQueryChange,
  onSearchActivate,
  onSearchBlur,
  onSearchClear,
}: FinderNavProps) {
  const nav = useWindowNavBehavior({
    isDesktop: isDesktopShell,
    isMobile: false,
    allowStandaloneClose: false,
  });

  return (
    <WindowNavShell
      isMobile={false}
      className="min-w-0 gap-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700"
      onMouseDown={nav.onDragStart}
      left={
        <div className="flex items-center gap-2 shrink-0">
          <WindowControls
            inShell={nav.inShell}
            showWhenNotInShell={true}
            className="p-2"
            onClose={nav.onClose}
            onMinimize={nav.onMinimize}
            onToggleMaximize={nav.onToggleMaximize}
            isMaximized={nav.isMaximized}
            closeLabel={nav.closeLabel}
          />
          <div className="flex shrink-0 items-center gap-1" onMouseDown={stopDragPropagation}>
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className={cn(
                "p-1 rounded",
                canGoBack
                  ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={onForward}
              disabled={!canGoForward}
              className={cn(
                "p-1 rounded",
                canGoForward
                  ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      }
      center={
        <div
          className="w-full truncate text-center text-sm text-zinc-600 dark:text-zinc-400"
          title={breadcrumbs.join(" / ")}
        >
          {breadcrumbs.join(" / ")}
        </div>
      }
      centerClassName="flex items-center justify-center px-2"
      right={
        <div
          className={cn(
            "flex items-center gap-1 justify-end shrink-0",
            searchActive ? "w-[250px]" : "w-auto"
          )}
          onMouseDown={stopDragPropagation}
        >
          <div className="relative">
            <button
              onClick={onToggleViewDropdown}
              onMouseDown={(event) => {
                if (searchActive) event.preventDefault();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              {viewMode === "icons" ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z" />
                </svg>
              )}
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showViewDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={onCloseViewDropdown} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-md shadow-lg border border-black/10 dark:border-white/10 py-1 min-w-32"
                  onMouseDown={(event) => {
                    if (searchActive) event.preventDefault();
                  }}
                >
                  <button
                    onClick={() => onSetViewMode("icons")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-zinc-900 dark:text-zinc-100 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    {viewMode === "icons" ? (
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : (
                      <span className="w-4" />
                    )}
                    <span>as Icons</span>
                  </button>
                  <button
                    onClick={() => onSetViewMode("list")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-zinc-900 dark:text-zinc-100 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    {viewMode === "list" ? (
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : (
                      <span className="w-4" />
                    )}
                    <span>as List</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {searchActive ? (
            <div className="relative w-48">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                onBlur={onSearchBlur}
                className="w-full pl-7 pr-7 py-0.5 rounded-lg bg-[#E8E8E7] dark:bg-[#353533] text-sm placeholder:text-muted-foreground outline-none border border-zinc-400/50 dark:border-zinc-500/50"
              />
              {searchQuery && (
                <button
                  onClick={onSearchClear}
                  onMouseDown={(event) => event.preventDefault()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onSearchActivate}
              className="p-1 rounded text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Search (/)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}
        </div>
      }
    />
  );
}
