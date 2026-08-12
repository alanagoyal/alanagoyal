"use client";

import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";
import { PHOTOS_HEADER_HEIGHT_CLASS_NAME } from "./header";

interface NavProps {
  isMobileView: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function Nav({ isMobileView, isScrolled, isDesktop = false }: NavProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });

  return (
    <div
      data-photos-header="true"
      className={PHOTOS_HEADER_HEIGHT_CLASS_NAME}
    >
      <WindowNavShell
        isMobile={isMobileView}
        isScrolled={isScrolled}
        className={cn(
          "h-full border-b",
          isScrolled ? "border-muted-foreground/20" : "border-transparent",
        )}
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
        right={<WindowNavSpacer isMobile={isMobileView} />}
      />
    </div>
  );
}
