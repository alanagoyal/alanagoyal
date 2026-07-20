"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowNavShell } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  isMobile: boolean;
  isDesktop?: boolean;
  title?: string;
  backTitle?: string;
}

export function Nav({ canGoBack, canGoForward, onBack, onForward, isMobile, isDesktop = false, title, backTitle }: NavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile });

  // Mobile layout
  if (isMobile) {
    return (
      <WindowNavShell
        isMobile={true}
        onMouseDown={nav.onDragStart}
        left={
          <button
            onClick={onBack}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!canGoBack}
            className={cn(
              "flex items-center gap-1 rounded-lg px-1 py-1 transition-colors text-[#0A7CFF]",
              canGoBack ? "can-hover:hover:bg-muted-foreground/10" : "opacity-0 pointer-events-none"
            )}
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
            {backTitle && <span className="text-sm">{backTitle}</span>}
          </button>
        }
        center={<span className="text-sm font-medium text-foreground truncate">{title || ""}</span>}
        centerClassName="px-2 text-center"
        right={<div className="w-[56px] shrink-0" aria-hidden />}
      />
    );
  }

  // Desktop layout: back/forward arrows
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
