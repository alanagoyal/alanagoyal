import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WindowNavShellProps {
  isMobile: boolean;
  isScrolled?: boolean;
  className?: string;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  left: ReactNode;
  center?: ReactNode;
  centerClassName?: string;
  right?: ReactNode;
}

export function WindowNavShell({
  isMobile,
  isScrolled = false,
  className,
  onMouseDown,
  left,
  center,
  centerClassName,
  right,
}: WindowNavShellProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center sticky top-0 z-[1] select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobile ? "bg-background" : "bg-muted",
        className
      )}
      onMouseDown={onMouseDown}
    >
      <div className="shrink-0">{left}</div>
      {center ? (
        <div className={cn("flex-1 min-w-0", centerClassName)}>{center}</div>
      ) : (
        <div className="flex-1" />
      )}
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export function WindowNavSpacer({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={cn("desktop:p-2 rounded-lg", isMobile && "p-2")}>
        <div className="w-4 h-4" />
      </div>
    </div>
  );
}
