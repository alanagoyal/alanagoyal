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
      className="absolute right-[70px] top-7 z-[70] w-[308px] overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 text-foreground shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      <div className="px-3 pb-0.5 pt-1">
        <p className="text-[13px] font-semibold leading-5">Focus</p>
        <p className="text-[11px] leading-4 text-muted-foreground">On</p>
      </div>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      <div>
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
              className="group mx-1.5 flex w-[calc(100%_-_0.75rem)] items-center gap-2.5 rounded-[5px] px-2 py-1 text-left transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  isActive
                    ? "bg-black/10 text-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.35)] can-hover:group-hover:bg-white/20 can-hover:group-hover:text-white dark:bg-white/15"
                    : "bg-black/10 text-muted-foreground can-hover:group-hover:bg-white/20 can-hover:group-hover:text-white dark:bg-white/10"
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
              <span className="text-[13px] leading-5">{config.name}</span>
            </button>
          );
        })}
      </div>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      <div>
        <button
          role="menuitem"
          onClick={() => scheduleFocusEnd(Date.now() + 60 * 60 * 1000)}
          className="mx-1.5 block w-[calc(100%_-_0.75rem)] rounded-[5px] py-1 pl-[46px] pr-2 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
        >
          For 1 hour
        </button>
        <button
          role="menuitem"
          onClick={() => scheduleFocusEnd(getEveningEndTime())}
          className="mx-1.5 block w-[calc(100%_-_0.75rem)] rounded-[5px] py-1 pl-[46px] pr-2 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
        >
          Until this evening
        </button>
      </div>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      <button
        role="menuitem"
        onClick={() => {
          onOpenSettings?.();
          onClose();
        }}
        className="mx-1.5 w-[calc(100%_-_0.75rem)] rounded-[5px] px-2 py-1 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
      >
        Focus Settings&hellip;
      </button>
    </div>
  );
}
