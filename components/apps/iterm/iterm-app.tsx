"use client";

import { useRef, useState } from "react";
import { Nav } from "./nav";
import { Terminal } from "./terminal";
import { cn } from "@/lib/utils";

const HOME_DIR = "/Users/alanagoyal";

interface ITermAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  onOpenTextFile?: (filePath: string, content: string) => void;
}

function formatWorkingDirectory(directory: string): string {
  if (directory === HOME_DIR) return "~";
  if (directory.startsWith(`${HOME_DIR}/`)) {
    return `~${directory.slice(HOME_DIR.length)}`;
  }
  return directory;
}

export function ITermApp({ isMobile = false, inShell = false, onOpenTextFile }: ITermAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDirectory, setCurrentDirectory] = useState(HOME_DIR);
  const sessionTitle = formatWorkingDirectory(currentDirectory);

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
      <Nav
        isMobile={isMobile}
        isDesktop={inShell}
        sessionTitle={sessionTitle}
      />
      <div className="flex-1 min-h-0 overflow-hidden bg-background">
        <Terminal
          isMobile={isMobile}
          onOpenTextFile={onOpenTextFile}
          onCurrentDirectoryChange={setCurrentDirectory}
        />
      </div>
    </div>
  );
}
