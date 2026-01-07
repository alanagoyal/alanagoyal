import { Icons } from "./icons";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";

interface NavProps {
  onNewChat: () => void;
  isMobileView: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function Nav({ onNewChat, isMobileView, isScrolled, isDesktop = false }: NavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = isDesktop && windowFocus;

  // Keyboard shortcut for creating a new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Check if this app should handle the shortcut
      // In desktop mode (windowFocus exists), check if this window is focused
      // In standalone mode, check if target is within this app
      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        if (!target.closest('[data-app="messages"]')) return;
      }

      // Don't trigger if typing in an input, if command/meta key is pressed,
      // or if the TipTap editor is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        e.metaKey ||
        document.querySelector(".ProseMirror")?.contains(document.activeElement)
      ) {
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        onNewChat();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, windowFocus]);

  return (
    <>
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none",
          isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
          isMobileView ? "bg-background" : "bg-muted",
          inShell && !windowFocus.isMaximized && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={inShell ? windowFocus.onDragStart : undefined}
      >
        <div className="window-controls flex items-center gap-1.5 p-2">
          {inShell ? (
            // Desktop shell - use window controls from context
            <>
              <button
                onClick={windowFocus.closeWindow}
                className="cursor-pointer group w-3 h-3 rounded-full bg-red-500 hover:opacity-80 flex items-center justify-center"
                aria-label="Close window"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-red-900 -translate-y-[0.5px]">×</span>
              </button>
              <button
                onClick={windowFocus.minimizeWindow}
                className="group w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 flex items-center justify-center cursor-pointer"
                aria-label="Minimize window"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-yellow-900 -translate-y-[0.5px]">−</span>
              </button>
              <button
                onClick={windowFocus.toggleMaximize}
                className="group w-3 h-3 rounded-full bg-green-500 hover:opacity-80 flex items-center justify-center cursor-pointer"
                aria-label={windowFocus.isMaximized ? "Restore window" : "Maximize window"}
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-medium leading-none text-green-900 -translate-y-[0.5px]">+</span>
              </button>
            </>
          ) : !isDesktop ? (
            // Standalone browser - close tab
            <>
              <button
                onClick={() => window.close()}
                className="cursor-pointer group w-3 h-3 rounded-full bg-red-500 hover:opacity-80 flex items-center justify-center"
                aria-label="Close tab"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-red-900 -translate-y-[0.5px]">×</span>
              </button>
              <button className="group w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 flex items-center justify-center cursor-default">
                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-yellow-900 -translate-y-[0.5px]">−</span>
              </button>
              <button className="group w-3 h-3 rounded-full bg-green-500 hover:opacity-80 flex items-center justify-center cursor-default">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-medium leading-none text-green-900 -translate-y-[0.5px]">+</span>
              </button>
            </>
          ) : null}
        </div>
        <button
          className={`sm:p-2 hover:bg-muted-foreground/10 rounded-lg ${
            isMobileView ? "p-2" : ""
          }`}
          onClick={onNewChat}
          aria-label="New conversation (n)"
        >
          <Icons.new />
        </button>
      </div>
    </>
  );
}
