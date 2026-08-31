"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface CalendarViewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumbersVisible: boolean;
  onWeekNumbersVisibleChange: (visible: boolean) => void;
}

export function CalendarViewMenu({
  isOpen,
  onClose,
  weekNumbersVisible,
  onWeekNumbersVisibleChange,
}: CalendarViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Calendar view options"
      className="absolute left-[128px] top-7 w-56 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={weekNumbersVisible}
        onClick={() => {
          onWeekNumbersVisibleChange(!weekNumbersVisible);
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        <span className="flex h-4 w-4 items-center justify-center">
          {weekNumbersVisible && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        <span>Show Week Numbers</span>
      </button>
    </div>
  );
}
