"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  isDesktop?: boolean;
  title?: string;
}

export function Nav({ canGoBack, canGoForward, onBack, onForward, isDesktop = false, title }: NavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: false });

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center gap-2 sticky top-0 z-[1] select-none bg-muted"
      )}
      onMouseDown={nav.onDragStart}
    >
      <button
        onClick={onBack}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!canGoBack}
        className={cn(
          "p-1 rounded-md transition-colors",
          canGoBack
            ? "can-hover:hover:bg-muted-foreground/10 text-foreground"
            : "text-muted-foreground/40 cursor-not-allowed"
        )}
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={onForward}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!canGoForward}
        className={cn(
          "p-1 rounded-md transition-colors",
          canGoForward
            ? "can-hover:hover:bg-muted-foreground/10 text-foreground"
            : "text-muted-foreground/40 cursor-not-allowed"
        )}
        aria-label="Go forward"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      {title && <span className="text-sm font-medium ml-1">{title}</span>}
    </div>
  );
}
