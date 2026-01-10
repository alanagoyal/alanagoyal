"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";

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
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = isDesktop && windowFocus;

  // Mobile layout: iOS-style header matching Messages chat-header
  if (isMobile) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-4 relative min-h-24 py-2 select-none bg-muted/30"
        )}
      >
        {/* Back button */}
        {canGoBack && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-8 h-8" />
              {backTitle && <span className="text-base">{backTitle}</span>}
            </button>
          </div>
        )}
        {/* Centered title */}
        {title && (
          <span className="text-base font-semibold w-full text-center">
            {title}
          </span>
        )}
      </div>
    );
  }

  // Desktop layout: back/forward arrows
  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center gap-2 select-none border-b border-border/50 bg-muted/50"
      )}
      onMouseDown={inShell ? windowFocus.onDragStart : undefined}
    >
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          "p-1 rounded-md transition-colors",
          canGoBack
            ? "hover:bg-muted-foreground/10 text-foreground"
            : "text-muted-foreground/40 cursor-not-allowed"
        )}
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={cn(
          "p-1 rounded-md transition-colors",
          canGoForward
            ? "hover:bg-muted-foreground/10 text-foreground"
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
