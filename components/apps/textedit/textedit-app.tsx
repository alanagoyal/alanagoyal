"use client";

import { useState, useRef, useEffect } from "react";
import { Nav } from "./nav";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useWindowFocus } from "@/lib/window-focus-context";

interface TextEditFile {
  path: string;
  content: string;
}

interface TextEditAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  // Multi-file support
  files?: TextEditFile[];
  activeIndex?: number;
  onFileSelect?: (index: number) => void;
  onFileClose?: (index: number) => void;
  // Legacy single-file support (for mobile or standalone)
  initialFilePath?: string;
  initialContent?: string;
}

export function TextEditApp({
  isMobile = false,
  inShell = false,
  files = [],
  activeIndex = 0,
  onFileSelect,
  onFileClose,
  initialFilePath,
  initialContent = "",
}: TextEditAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();

  // Escape key handler to unfocus and allow global shortcuts (like 'q' to quit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if this app should handle the shortcut
      if (windowFocus && !windowFocus.isFocused) return;

      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [windowFocus]);

  // For standalone/mobile mode, use local state
  const [localContent, setLocalContent] = useState(initialContent);
  const [localFileName, setLocalFileName] = useState<string | null>(null);

  // Track content changes for each file (in multi-file mode)
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  // Initialize file contents from files prop
  useEffect(() => {
    if (files.length === 0) return; // Don't update state for empty files array
    const newContents: Record<string, string> = {};
    files.forEach(file => {
      // Preserve existing edits, or use original content
      newContents[file.path] = fileContents[file.path] ?? file.content;
    });
    setFileContents(newContents);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy: Extract filename from path for standalone mode
  useEffect(() => {
    if (initialFilePath) {
      const name = initialFilePath.split("/").pop() || "Untitled";
      setLocalFileName(name);
    } else {
      setLocalFileName(null);
    }
  }, [initialFilePath]);

  // Legacy: Update content when initialContent changes
  useEffect(() => {
    setLocalContent(initialContent);
  }, [initialContent]);

  // Determine if we're in multi-file mode
  const isMultiFileMode = files.length > 0;
  const activeFile = isMultiFileMode ? files[activeIndex] : null;
  const currentContent = isMultiFileMode
    ? (activeFile ? (fileContents[activeFile.path] ?? activeFile.content) : "")
    : localContent;
  const currentFileName = isMultiFileMode
    ? (activeFile?.path.split("/").pop() || "Untitled")
    : (localFileName || "Untitled");

  const handleContentChange = (newContent: string) => {
    if (isMultiFileMode && activeFile) {
      setFileContents(prev => ({
        ...prev,
        [activeFile.path]: newContent,
      }));
    } else {
      setLocalContent(newContent);
    }
  };

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
      <Nav
        isMobile={isMobile}
        isDesktop={inShell}
        fileName={isMultiFileMode ? null : currentFileName}
      />

      {/* Tab bar for multiple files */}
      {isMultiFileMode && files.length > 0 && (
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
          {files.map((file, index) => {
            const fileName = file.path.split("/").pop() || "Untitled";
            const isActive = index === activeIndex;
            return (
              <div
                key={file.path}
                className={cn(
                  "group flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer border-r border-zinc-200 dark:border-zinc-700 min-w-0",
                  isActive
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                onClick={() => onFileSelect?.(index)}
              >
                <span className="truncate max-w-[150px]">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose?.(index);
                  }}
                  className={cn(
                    "p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <textarea
          value={currentContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full bg-transparent resize-none outline-none font-mono text-sm leading-relaxed p-4 overflow-auto"
          placeholder="Start typing..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
