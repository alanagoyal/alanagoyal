"use client";

import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface NavProps {
  isDesktop?: boolean;
  sessionTitle: string;
}

export function Nav({ isDesktop = false, sessionTitle }: NavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: false });

  return (
    <WindowNavShell
      isMobile={false}
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
          className="flex min-w-0 items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground"
          aria-label={`Terminal session, ${sessionTitle}`}
          title={sessionTitle}
        >
          <span
            aria-hidden="true"
            className="flex size-3.5 shrink-0 items-center justify-center rounded-[1px] bg-foreground font-mono text-[8px] font-bold leading-none text-background"
          >
            &gt;_
          </span>
          <span className="truncate">{sessionTitle}</span>
        </span>
      }
      centerClassName="px-3"
      right={<WindowNavSpacer isMobile={false} />}
    />
  );
}
