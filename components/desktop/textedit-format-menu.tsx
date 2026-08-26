"use client";

import { useRef } from "react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface TextEditFormatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  wrapToPage: boolean;
  onWrapToPageChange: (wrapToPage: boolean) => void;
}

export function TextEditFormatMenu({
  isOpen,
  onClose,
  wrapToPage,
  onWrapToPageChange,
}: TextEditFormatMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      data-testid="textedit-format-menu"
      className="absolute left-[218px] top-7 z-[70] w-48 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      <button
        type="button"
        onClick={() => {
          onWrapToPageChange(!wrapToPage);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
      >
        {wrapToPage ? "Wrap to Window" : "Wrap to Page"}
      </button>
    </div>
  );
}
