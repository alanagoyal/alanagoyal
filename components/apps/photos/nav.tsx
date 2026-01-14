"use client";

import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";

interface NavProps {
  isMobileView: boolean;
  isScrolled?: boolean;
  isDesktop?: boolean;
}

export function Nav({ isMobileView, isScrolled, isDesktop = false }: NavProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobileView ? "bg-background" : "bg-muted"
      )}
      onMouseDown={inShell ? windowFocus.onDragStart : undefined}
    >
      <div className="window-controls flex items-center gap-1.5 p-2">
        {inShell ? (
          <>
            <button
              onClick={windowFocus.closeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
              aria-label="Close window"
            />
            <button
              onClick={windowFocus.minimizeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"
              aria-label="Minimize window"
            />
            <button
              onClick={windowFocus.toggleMaximize}
              className="cursor-pointer w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"
              aria-label="Maximize window"
            />
          </>
        ) : !isDesktop ? (
          <>
            <button
              onClick={() => window.close()}
              className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
              aria-label="Close tab"
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500 cursor-default" />
            <button className="w-3 h-3 rounded-full bg-green-500 cursor-default" />
          </>
        ) : null}
      </div>
    </div>
  );
}
