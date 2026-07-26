"use client";

import {
  Atom,
  BedDouble,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { getEveningFocusEndTime } from "@/lib/focus";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import {
  useSystemSettings,
  type FocusMode,
} from "@/lib/system-settings-context";
import { cn } from "@/lib/utils";

export const FOCUS_STATUS_CONFIG: Record<
  Exclude<FocusMode, "off">,
  {
    name: string;
    icon: LucideIcon;
    activeIconClassName: string;
  }
> = {
  doNotDisturb: {
    name: "Do Not Disturb",
    icon: Moon,
    activeIconClassName:
      "text-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.35)]",
  },
  sleep: {
    name: "Sleep",
    icon: BedDouble,
    activeIconClassName:
      "text-teal-500 shadow-[0_0_16px_rgba(20,184,166,0.35)]",
  },
  reduceInterruptions: {
    name: "Reduce Interruptions",
    icon: Atom,
    activeIconClassName:
      "text-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.35)]",
  },
};

const FOCUS_MODES = Object.entries(FOCUS_STATUS_CONFIG) as Array<
  [
    Exclude<FocusMode, "off">,
    (typeof FOCUS_STATUS_CONFIG)[Exclude<FocusMode, "off">],
  ]
>;

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
  const { focusMode, setFocusMode, scheduleFocusEnd } =
    useSystemSettings();
  const eveningEndTime = getEveningFocusEndTime();

  useClickOutside(menuRef, onClose, isOpen);

  useEffect(() => {
    if (isOpen && focusMode === "off") {
      onClose();
    }
  }, [focusMode, isOpen, onClose]);

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
                    ? cn(
                        "bg-black/10 can-hover:group-hover:bg-white/20 can-hover:group-hover:text-white dark:bg-white/15",
                        config.activeIconClassName
                      )
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
          onClick={() => {
            scheduleFocusEnd(Date.now() + 60 * 60 * 1000);
            onClose();
          }}
          className="mx-1.5 block w-[calc(100%_-_0.75rem)] rounded-[5px] py-1 pl-[46px] pr-2 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
        >
          For 1 hour
        </button>
        {eveningEndTime !== null && (
          <button
            role="menuitem"
            onClick={() => {
              const endTime = getEveningFocusEndTime();
              if (endTime !== null) {
                scheduleFocusEnd(endTime);
              }
              onClose();
            }}
            className="mx-1.5 block w-[calc(100%_-_0.75rem)] rounded-[5px] py-1 pl-[46px] pr-2 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
          >
            Until this evening
          </button>
        )}
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
