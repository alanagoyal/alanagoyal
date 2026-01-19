"use client";

import { useRef } from "react";
import { Nav } from "./nav";
import { Terminal } from "./terminal";
import { cn } from "@/lib/utils";

interface ITermAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  onOpenTextFile?: (filePath: string, content: string) => void;
}

export function ITermApp({ isMobile = false, inShell = false, onOpenTextFile }: ITermAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      data-app="iterm"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className={cn(
        "iterm-app flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none overflow-hidden",
        isMobile ? "h-dvh w-full" : "h-full"
      )}
    >
      <Nav isMobile={isMobile} isDesktop={inShell} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <Terminal isMobile={isMobile} onOpenTextFile={onOpenTextFile} />
      </div>
    </div>
  );
}
