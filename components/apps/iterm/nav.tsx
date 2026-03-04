"use client";

import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  isMobile: boolean;
  isDesktop?: boolean;
}

export function Nav({ isMobile, isDesktop = false }: NavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile });

  return (
    <WindowNavShell
      isMobile={isMobile}
      onMouseDown={nav.onDragStart}
      className="min-w-0"
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
      right={<WindowNavSpacer isMobile={isMobile} />}
    />
  );
}
