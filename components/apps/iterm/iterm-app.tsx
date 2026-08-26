"use client";

import { useRef, useState } from "react";
import { Nav } from "./nav";
import { Terminal } from "./terminal";

const HOME_DIR = "/Users/alanagoyal";

interface ITermAppProps {
  inShell?: boolean;
  onOpenDirectory?: (directoryPath: string) => void;
  onOpenTextFile?: (filePath: string, content: string) => void;
}

function formatWorkingDirectory(directory: string): string {
  if (directory === HOME_DIR) return "~";
  if (directory.startsWith(`${HOME_DIR}/`)) {
    return `~${directory.slice(HOME_DIR.length)}`;
  }
  return directory;
}

export function ITermApp({
  inShell = false,
  onOpenDirectory,
  onOpenTextFile,
}: ITermAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDirectory, setCurrentDirectory] = useState(HOME_DIR);
  const sessionTitle = formatWorkingDirectory(currentDirectory);

  return (
    <div
      ref={containerRef}
      data-app="iterm"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="iterm-app flex h-full flex-col overflow-hidden bg-white text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
    >
      <Nav isDesktop={inShell} sessionTitle={sessionTitle} />
      <div className="flex-1 min-h-0 overflow-hidden bg-background">
        <Terminal
          onOpenDirectory={onOpenDirectory}
          onOpenTextFile={onOpenTextFile}
          onCurrentDirectoryChange={setCurrentDirectory}
        />
      </div>
    </div>
  );
}
