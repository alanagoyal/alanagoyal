"use client";

import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";

interface NavProps {
  isMobile: boolean;
  isDesktop?: boolean;
  title?: string;
}

export function Nav({ isMobile, isDesktop = false, title = "zsh" }: NavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = isDesktop && windowFocus;

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center sticky top-0 z-[1] select-none bg-[#1e1e1e] border-b border-[#3d3d3d]",
        inShell && !windowFocus?.isMaximized && "cursor-grab active:cursor-grabbing"
      )}
      onMouseDown={inShell ? windowFocus?.onDragStart : undefined}
    >
      <div className="window-controls flex items-center gap-1.5 p-2">
        {inShell ? (
          // Desktop shell - use window controls from context
          <>
            <button
              onClick={windowFocus?.closeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
              aria-label="Close window"
            />
            <button
              onClick={windowFocus?.minimizeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"
              aria-label="Minimize window"
            />
            <button
              onClick={windowFocus?.toggleMaximize}
              className="cursor-pointer w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"
              aria-label={windowFocus?.isMaximized ? "Restore window" : "Maximize window"}
            />
          </>
        ) : (
          // Static buttons (mobile shell or standalone browser)
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
      <div className="flex-1 text-center text-sm text-gray-400 font-medium">
        {title}
      </div>
      <div className="w-[76px]" /> {/* Spacer to balance the traffic lights */}
    </div>
  );
}
