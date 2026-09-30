"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { TEXTEDIT_ZOOM_LEVELS } from "@/lib/textedit-zoom";

interface TextEditViewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function TextEditViewMenu({ isOpen, onClose, zoom, onZoomChange }: TextEditViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  const index = TEXTEDIT_ZOOM_LEVELS.findIndex((level) => level === zoom);
  const commands = [
    { label: "Zoom In", value: TEXTEDIT_ZOOM_LEVELS[index + 1] },
    { label: "Zoom Out", value: TEXTEDIT_ZOOM_LEVELS[index - 1] },
    { label: "Actual Size", value: zoom === 100 ? undefined : 100 },
  ];

  // Keep document commands above maximized windows as well as ordinary ones.
  return createPortal(
    <div
      ref={menuRef}
      data-testid="textedit-view-menu"
      className="fixed left-[283px] top-7 z-[90] w-48 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 text-foreground shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      {commands.map(({ label, value }) => (
        <button
          key={label}
          type="button"
          disabled={value === undefined}
          onClick={() => {
            if (value === undefined) return;
            onZoomChange(value);
            onClose();
          }}
          className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors enabled:can-hover:hover:bg-blue-500 enabled:can-hover:hover:text-white disabled:text-muted-foreground/50"
        >
          {label}
          {label === "Actual Size" && <span className="text-[11px]">100%</span>}
        </button>
      ))}
    </div>,
    document.body
  );
}
