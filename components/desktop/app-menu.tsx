"use client";

import { useRef } from "react";
import { Info, X } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
  onAbout: () => void;
  onQuit: () => void;
}

export function AppMenu({
  isOpen,
  onClose,
  appId,
  appName,
  onAbout,
  onQuit,
}: AppMenuProps) {
  // Finder can be closed but not quit
  const canQuit = appId !== "finder";
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-7 left-[68px] w-56 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl shadow-2xl border border-black/10 dark:border-white/10 py-1 z-[70] overflow-hidden"
    >
      <MenuItem
        icon={<Info className="w-4 h-4" />}
        label={`About ${appName}`}
        onClick={() => {
          onAbout();
          onClose();
        }}
      />

      {canQuit && (
        <>
          <MenuDivider />

          <MenuItem
            icon={<X className="w-4 h-4" />}
            label={`Quit ${appName}`}
            shortcut="Q"
            onClick={() => {
              onQuit();
              onClose();
            }}
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-white">{icon}</span>
      <span>{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-muted-foreground group-hover:text-white/70">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t border-black/10 dark:border-white/10" />;
}
