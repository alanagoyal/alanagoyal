"use client";

import { useRef } from "react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface TextEditEditMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: () => void;
}

export function TextEditEditMenu({ isOpen, onClose, onFind }: TextEditEditMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute left-[172px] top-7 w-56 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      <button
        onClick={() => {
          onFind();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        Find…
      </button>
    </div>
  );
}
