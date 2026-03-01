"use client";

import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";
import { WindowControls } from "@/components/window-controls";

interface NavProps {
  isMobile: boolean;
  isDesktop?: boolean;
  fileName?: string | null;
}

export function Nav({ isMobile, isDesktop = false, fileName }: NavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = !!(isDesktop && windowFocus);

  return (
    <div
      className={cn(
        "px-4 py-2 flex min-w-0 items-center justify-between select-none bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700",
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
      <div className="flex-1 min-w-0 px-2 text-center">
        <span className="block truncate text-zinc-500 dark:text-zinc-400 text-sm">
          {fileName || "Untitled"}
        </span>
      </div>
      <div className="w-[68px] shrink-0" /> {/* Spacer to balance the layout */}
    </div>
  );
}
