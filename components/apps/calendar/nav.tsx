"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useWindowFocus } from "@/lib/window-focus-context";
import { WindowControls } from "@/components/window-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ViewType } from "./types";

interface NavProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  onNewEvent: () => void;
  inShell?: boolean;
  isMobile?: boolean;
}

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function Nav({
  view,
  onViewChange,
  onNavigate,
  onToday,
  onNewEvent,
  inShell = false,
  isMobile = false,
}: NavProps) {
  const windowFocus = useWindowFocus();
  const showWindowControls = inShell && windowFocus;

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none bg-muted border-b border-border/50"
      )}
      onMouseDown={showWindowControls ? windowFocus?.onDragStart : undefined}
    >
      {/* Left section - window controls and add button */}
      <div className="flex items-center gap-2">
        <WindowControls
          inShell={!!showWindowControls}
          className="p-2"
          onClose={
            showWindowControls
              ? windowFocus?.closeWindow
              : !isMobile
                ? () => window.close()
                : undefined
          }
          onMinimize={showWindowControls ? windowFocus?.minimizeWindow : undefined}
          onToggleMaximize={
            showWindowControls ? windowFocus?.toggleMaximize : undefined
          }
          isMaximized={windowFocus?.isMaximized ?? false}
          closeLabel={showWindowControls ? "Close window" : "Close tab"}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onNewEvent}
          className="h-8 w-8"
          title="New Event"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Center section - view switcher */}
      <div className="flex items-center bg-background/50 rounded-lg p-0.5 border border-border/50">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onViewChange(option.value)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md transition-colors",
              view === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Right section - navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("prev")}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="h-8 px-3 text-sm"
        >
          Today
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("next")}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
