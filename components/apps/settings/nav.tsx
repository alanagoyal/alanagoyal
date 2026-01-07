"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  isMobile: boolean;
  isDesktop?: boolean;
  title?: string;
}

export function Nav({ canGoBack, canGoForward, onBack, onForward, isMobile, isDesktop = false, title }: NavProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center gap-2 select-none border-b border-border/50",
        isMobile ? "bg-background" : "bg-muted/50"
      )}
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
