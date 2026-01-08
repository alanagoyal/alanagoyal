"use client";

import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";

interface NavProps {
  isMobile: boolean;
  isDesktop?: boolean;
}

export function Nav({ isMobile, isDesktop = false }: NavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = isDesktop && windowFocus;

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between select-none bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700",
        inShell && !windowFocus.isMaximized && "cursor-grab active:cursor-grabbing"
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
              aria-label={windowFocus.isMaximized ? "Restore window" : "Maximize window"}
            />
          </>
        ) : (
          <>
            <button
              onClick={!isMobile ? () => window.close() : undefined}
              className={cn(
                "w-3 h-3 rounded-full bg-red-500",
                !isMobile && "cursor-pointer hover:bg-red-700"
              )}
              aria-label={!isMobile ? "Close tab" : undefined}
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500 cursor-default" />
            <button className="w-3 h-3 rounded-full bg-green-500 cursor-default" />
          </>
        )}
      </div>
      <div className="flex-1 text-center">
        <span className="text-zinc-500 dark:text-zinc-400 text-sm">alanagoyal@Alanas-MacBook-Air</span>
      </div>
      <div className="w-[68px]" /> {/* Spacer to balance the layout */}
    </div>
  );
}
