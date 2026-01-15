"use client";

import { useState, useRef, useEffect } from "react";
import { Nav } from "./nav";
import { cn } from "@/lib/utils";

interface TextEditAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  initialFilePath?: string;
  initialContent?: string;
}

export function TextEditApp({
  isMobile = false,
  inShell = false,
  initialFilePath,
  initialContent = "",
}: TextEditAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState<string | null>(null);

  // Extract filename from path
  useEffect(() => {
    if (initialFilePath) {
      const name = initialFilePath.split("/").pop() || "Untitled";
      setFileName(name);
    } else {
      setFileName(null);
    }
  }, [initialFilePath]);

  // Update content when initialContent changes (new file opened)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div
      ref={containerRef}
      data-app="textedit"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className={cn(
        "textedit-app flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none overflow-hidden",
        isMobile ? "h-dvh w-full" : "h-full"
      )}
    >
      <Nav isMobile={isMobile} isDesktop={inShell} fileName={fileName} />
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
          placeholder="Start typing..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
