"use client";

import { useRef } from "react";
import { FolderOpen, X } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface PreviewFileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onCloseWindow: () => void;
}

export function PreviewFileMenu({
  isOpen,
  onClose,
  onOpen,
  onCloseWindow,
}: PreviewFileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      data-testid="preview-file-menu"
      className="absolute left-[120px] top-7 z-[70] w-56 overflow-hidden rounded-xl border border-black/10 bg-white/95 py-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      <button
        type="button"
        onClick={() => {
          onOpen();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        <FolderOpen aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span>Open…</span>
      </button>

      <div className="mx-3 my-1 border-t border-black/10 dark:border-white/10" />

      <button
        type="button"
        onClick={() => {
          onCloseWindow();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        <X aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span>Close Window</span>
      </button>
    </div>
  );
}
