"use client";

import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { WindowControls } from "@/components/window-controls";

interface SidebarNavProps {
  isMobile: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function SidebarNav({ isMobile, isScrolled, isDesktop = false }: SidebarNavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = !!(isDesktop && windowFocus);

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobile ? "bg-muted/30" : "bg-muted",
      )}
      onMouseDown={inShell ? windowFocus?.onDragStart : undefined}
    >
      <WindowControls
        inShell={inShell}
        className="p-2"
        onClose={inShell ? windowFocus?.closeWindow : !isMobile ? () => window.close() : undefined}
        onMinimize={inShell ? windowFocus?.minimizeWindow : undefined}
        onToggleMaximize={inShell ? windowFocus?.toggleMaximize : undefined}
        isMaximized={windowFocus?.isMaximized ?? false}
        closeLabel={inShell ? "Close window" : "Close tab"}
      />
      {/* Invisible spacer matching NewNote structure in Notes */}
      <div className="flex flex-col items-center justify-center">
        <div className={cn("sm:p-2 rounded-lg", isMobile && "p-2")}>
          <div className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
