"use client";

import { useWindowFocus } from "@/lib/window-focus-context";

interface UseWindowNavBehaviorProps {
  isDesktop?: boolean;
  isMobile?: boolean;
  shellEnabled?: boolean;
}

export function useWindowNavBehavior({
  isDesktop = false,
  isMobile = false,
  shellEnabled = true,
}: UseWindowNavBehaviorProps) {
  const windowFocus = useWindowFocus();
  const inShell = !!(shellEnabled && isDesktop && windowFocus);

  return {
    inShell,
    onDragStart: inShell ? windowFocus?.onDragStart : undefined,
    onClose: inShell ? windowFocus?.closeWindow : !isMobile ? () => window.close() : undefined,
    onMinimize: inShell ? windowFocus?.minimizeWindow : undefined,
    onToggleMaximize: inShell ? windowFocus?.toggleMaximize : undefined,
    isMaximized: windowFocus?.isMaximized ?? false,
    closeLabel: inShell ? "Close window" : "Close tab",
  };
}
