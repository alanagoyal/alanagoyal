"use client";

import {
  Atom,
  BedDouble,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import {
  useSystemSettings,
  type FocusMode,
} from "@/lib/system-settings-context";
import { cn } from "@/lib/utils";

const FOCUS_ENDS_AT_STORAGE_KEY = "desktop-focus-ends-at";

export const FOCUS_STATUS_CONFIG: Record<
  Exclude<FocusMode, "off">,
  { name: string; icon: LucideIcon }
> = {
  doNotDisturb: { name: "Do Not Disturb", icon: Moon },
  sleep: { name: "Sleep", icon: BedDouble },
  reduceInterruptions: {
    name: "Reduce Interruptions",
    icon: Atom,
  },
};

const FOCUS_MODES = Object.entries(FOCUS_STATUS_CONFIG) as Array<
  [
    Exclude<FocusMode, "off">,
    (typeof FOCUS_STATUS_CONFIG)[Exclude<FocusMode, "off">],
  ]
>;

function loadFocusEndsAt(): number | null {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem(
    FOCUS_ENDS_AT_STORAGE_KEY
  );
  if (!storedValue) return null;

  const timestamp = Number(storedValue);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getEveningEndTime(now = new Date()): number {
  const evening = new Date(now);
  evening.setHours(19, 0, 0, 0);

  if (evening.getTime() <= now.getTime()) {
    evening.setDate(evening.getDate() + 1);
  }

  return evening.getTime();
}

interface FocusMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function FocusMenu({
  isOpen,
  onClose,
  onOpenSettings,
}: FocusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { focusMode, setFocusMode } = useSystemSettings();
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(
    loadFocusEndsAt
  );

  useClickOutside(menuRef, onClose, isOpen);

  const clearFocusEnd = useCallback(() => {
    setFocusEndsAt(null);
    window.localStorage.removeItem(FOCUS_ENDS_AT_STORAGE_KEY);
  }, []);

  const scheduleFocusEnd = useCallback(
    (timestamp: number) => {
      setFocusEndsAt(timestamp);
      window.localStorage.setItem(
        FOCUS_ENDS_AT_STORAGE_KEY,
        String(timestamp)
      );
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (focusMode === "off" && focusEndsAt !== null) {
      clearFocusEnd();
    }
  }, [clearFocusEnd, focusEndsAt, focusMode]);

  useEffect(() => {
    if (focusEndsAt === null) return;

    const remaining = focusEndsAt - Date.now();
    if (remaining <= 0) {
      setFocusMode("off");
      clearFocusEnd();
      onClose();
      return;
    }

    const timeout = window.setTimeout(() => {
      setFocusMode("off");
      clearFocusEnd();
      onClose();
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [clearFocusEnd, focusEndsAt, onClose, setFocusMode]);

  if (!isOpen || focusMode === "off") return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Focus"
      className="absolute right-[70px] top-7 z-[70] w-[308px] overflow-hidden rounded-2xl border border-black/20 bg-white/92 text-foreground shadow-2xl backdrop-blur-2xl dark:border-white/25 dark:bg-zinc-800/92"
    >
      <div className="px-3 py-1.5">
        <p className="text-[13px] font-semibold leading-[15px]">Focus</p>
        <p className="text-xs leading-[15px] text-muted-foreground">On</p>
      </div>

      <div className="mx-3 border-t border-black/10 dark:border-white/10" />

      <div className="px-2 py-1">
        {FOCUS_MODES.map(([mode, config]) => {
          const isActive = focusMode === mode;
          const Icon = config.icon;

          return (
            <button
              key={mode}
              role="menuitemradio"
              aria-checked={isActive}
              onClick={() => {
                clearFocusEnd();
                if (isActive) {
                  setFocusMode("off");
                  onClose();
                } else {
                  setFocusMode(mode);
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-0.5 text-left transition-colors can-hover:hover:bg-black/5 dark:can-hover:hover:bg-white/10"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  isActive
                    ? "bg-black/10 text-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.35)] dark:bg-white/15"
                    : "bg-black/10 text-muted-foreground dark:bg-white/10"
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4",
                    mode === "doNotDisturb" && "fill-current"
                  )}
                />
              </span>
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-black/[0.07] px-[54px] py-1 dark:bg-white/10">
        <button
          role="menuitem"
          onClick={() => scheduleFocusEnd(Date.now() + 60 * 60 * 1000)}
          className="block w-full rounded px-2 py-0.5 text-left text-sm font-medium transition-colors can-hover:hover:bg-black/5 dark:can-hover:hover:bg-white/10"
        >
          For 1 hour
        </button>
        <button
          role="menuitem"
          onClick={() => scheduleFocusEnd(getEveningEndTime())}
          className="block w-full rounded px-2 py-0.5 text-left text-sm font-medium transition-colors can-hover:hover:bg-black/5 dark:can-hover:hover:bg-white/10"
        >
          Until this evening
        </button>
      </div>

      <div className="border-t border-black/10 px-2 py-1.5 dark:border-white/10">
        <button
          role="menuitem"
          onClick={() => {
            onOpenSettings?.();
            onClose();
          }}
          className="w-full rounded-lg px-2 py-0.5 text-left text-sm font-medium transition-colors can-hover:hover:bg-black/5 dark:can-hover:hover:bg-white/10"
        >
          Focus Settings&hellip;
        </button>
      </div>
    </div>
  );
}
