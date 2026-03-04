"use client";

import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

interface SidebarNavProps {
  isMobile: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function SidebarNav({ isMobile, isScrolled, isDesktop = false }: SidebarNavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile });

  return (
    <WindowNavShell
      isMobile={isMobile}
      isScrolled={isScrolled}
      onMouseDown={nav.onDragStart}
      left={
        <WindowControls
          inShell={nav.inShell}
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
