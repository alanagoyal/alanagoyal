"use client";

import {
  Atom,
  BedDouble,
  Moon,
  type LucideIcon,
} from "lucide-react";
import {
  useSystemSettings,
  type FocusMode,
} from "@/lib/system-settings-context";
import { cn } from "@/lib/utils";

type ActiveFocusMode = Exclude<FocusMode, "off">;

const focusRows: Array<{
  id: ActiveFocusMode;
  name: string;
  icon: LucideIcon;
  iconClassName: string;
  iconBackground: string;
}> = [
  {
    id: "doNotDisturb",
    name: "Do Not Disturb",
    icon: Moon,
    iconClassName: "fill-current",
    iconBackground: "bg-gradient-to-b from-violet-400 to-indigo-600",
  },
  {
    id: "reduceInterruptions",
    name: "Reduce Interruptions",
    icon: Atom,
    iconClassName: "",
    iconBackground: "bg-gradient-to-b from-fuchsia-400 to-fuchsia-600",
  },
  {
    id: "sleep",
    name: "Sleep",
    icon: BedDouble,
    iconClassName: "",
    iconBackground: "bg-gradient-to-b from-teal-300 to-teal-500",
  },
];

function formatFocusStatus(focusEndsAt: number): string {
  return `Until ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(focusEndsAt)}`;
}

interface FocusPanelProps {
  isMobile?: boolean;
}

export function FocusPanel({ isMobile = false }: FocusPanelProps) {
  const { focusMode, setFocusMode, focusEndsAt } =
    useSystemSettings();

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl",
        isMobile ? "space-y-4 p-4" : "space-y-4 p-6"
      )}
    >
      {isMobile && <h1 className="text-xl font-bold">Focus</h1>}

      <div
        role="group"
        aria-label="Focus modes"
        className="overflow-hidden rounded-xl bg-muted/60"
      >
        {focusRows.map((row, index) => {
          const isActive = focusMode === row.id;
          const Icon = row.icon;

          return (
            <button
              key={row.id}
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() =>
                setFocusMode(isActive ? "off" : row.id)
              }
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors can-hover:hover:bg-muted",
                index < focusRows.length - 1 &&
                  "border-b border-border/50"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                  row.iconBackground
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("h-5 w-5", row.iconClassName)}
                />
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 font-medium",
                  isMobile ? "text-base" : "text-sm"
                )}
              >
                {row.name}
              </span>

              {isActive && focusEndsAt !== null && (
                <span
                  className={cn(
                    "shrink-0 text-muted-foreground",
                    isMobile ? "text-sm" : "text-xs"
                  )}
                >
                  {formatFocusStatus(focusEndsAt)}
                </span>
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  isActive
                    ? "bg-[#0A7CFF]"
                    : "bg-muted-foreground/35"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    isActive && "translate-x-4"
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-muted/60 px-4 py-3">
        <h2 className="text-sm font-medium">Share across devices</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Focus is shared across the desktop so supported apps respond
          to the active mode.
        </p>
      </div>

      <div className="rounded-xl bg-muted/60 px-4 py-3">
        <h2 className="text-sm font-medium">Focus status</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Messages quiets incoming notification banners while a Focus
          is active.
        </p>
      </div>
    </div>
  );
}
