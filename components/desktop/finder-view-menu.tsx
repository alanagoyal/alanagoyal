"use client";

import { useRef } from "react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import {
  FINDER_VIEW_MODES,
  FINDER_VIEW_MODE_LABELS,
  FinderViewModeIcon,
  type FinderViewMode,
} from "@/components/apps/finder/view-mode";

interface FinderViewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: FinderViewMode;
  onViewModeChange: (mode: FinderViewMode) => void;
  statusBarVisible: boolean;
  onStatusBarVisibleChange: (visible: boolean) => void;
}

export function FinderViewMenu({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  statusBarVisible,
  onStatusBarVisibleChange,
}: FinderViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-7 left-[120px] w-56 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      {FINDER_VIEW_MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => {
            onViewModeChange(mode);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
        >
          {viewMode === mode ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l5 5L20 7" />
            </svg>
          ) : (
            <span className="w-4" />
          )}
          <FinderViewModeIcon mode={mode} className="h-4 w-4" />
          <span>{FINDER_VIEW_MODE_LABELS[mode]}</span>
        </button>
      ))}

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      <button
        onClick={() => {
          onStatusBarVisibleChange(!statusBarVisible);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        {statusBarVisible ? "Hide Status Bar" : "Show Status Bar"}
      </button>
    </div>
  );
}
