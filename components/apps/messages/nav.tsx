import { Icons } from "./icons";
import { useEffect } from "react";
import { WindowControls } from "@/components/window-controls";
import { useWindowFocus } from "@/lib/window-focus-context";
import { WindowNavShell } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  onNewChat: () => void;
  isMobileView: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function Nav({ onNewChat, isMobileView, isScrolled, isDesktop = false }: NavProps) {
  const windowFocus = useWindowFocus();
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });

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
    <WindowNavShell
      isMobile={isMobileView}
      isScrolled={isScrolled}
      onMouseDown={nav.onDragStart}
      left={
        <WindowControls
          inShell={nav.inShell}
          showWhenNotInShell={!isDesktop}
          className="p-2"
          onClose={nav.onClose}
          onMinimize={nav.onMinimize}
          onToggleMaximize={nav.onToggleMaximize}
          isMaximized={nav.isMaximized}
          closeLabel={nav.closeLabel}
        />
      }
      right={
        <button
          className={`desktop:p-2 hover:bg-muted-foreground/10 rounded-lg ${
            isMobileView ? "p-2" : ""
          }`}
          onClick={onNewChat}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="New conversation (n)"
        >
          <Icons.new />
        </button>
      }
    />
  );
}
