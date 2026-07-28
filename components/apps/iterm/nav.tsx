"use client";

import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  isMobile: boolean;
  isDesktop?: boolean;
  sessionTitle: string;
}

export function Nav({ isMobile, isDesktop = false, sessionTitle }: NavProps) {
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
      center={
        <span
          className="block truncate text-center text-xs font-medium text-muted-foreground"
          aria-label={`Terminal session, ${sessionTitle}`}
          title={sessionTitle}
        >
          {sessionTitle}
        </span>
      }
      centerClassName="px-3"
      right={<WindowNavSpacer isMobile={isMobile} />}
    />
  );
}
