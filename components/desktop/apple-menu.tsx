"use client";

import { useRef } from "react";
import {
  Monitor,
  Settings,
  Moon,
  RotateCcw,
  Power,
  Lock,
  LogOut,
} from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface AppleMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAboutThisMac: () => void;
  onSystemSettings: () => void;
  onSleep: () => void;
  onRestart: () => void;
  onShutdown: () => void;
  onLockScreen: () => void;
  onLogout: () => void;
}

export function AppleMenu({
  isOpen,
  onClose,
  onAboutThisMac,
  onSystemSettings,
  onSleep,
  onRestart,
  onShutdown,
  onLockScreen,
  onLogout,
}: AppleMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-7 left-2 w-64 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl shadow-2xl border border-black/10 dark:border-white/10 py-1 z-[1000] overflow-hidden"
    >
      <MenuItem
        icon={<Monitor className="w-4 h-4" />}
        label="About This Mac"
        onClick={() => {
          onAboutThisMac();
          onClose();
        }}
      />

      <MenuDivider />

      <MenuItem
        icon={<Settings className="w-4 h-4" />}
        label="System Settings..."
        onClick={() => {
          onSystemSettings();
          onClose();
        }}
      />

      <MenuDivider />

      <MenuItem
        icon={<Moon className="w-4 h-4" />}
        label="Sleep"
        onClick={() => {
          onSleep();
          onClose();
        }}
      />

      <MenuItem
        icon={<RotateCcw className="w-4 h-4" />}
        label="Restart..."
        onClick={() => {
          onRestart();
          onClose();
        }}
      />

      <MenuItem
        icon={<Power className="w-4 h-4" />}
        label="Shut Down..."
        onClick={() => {
          onShutdown();
          onClose();
        }}
      />

      <MenuDivider />

      <MenuItem
        icon={<Lock className="w-4 h-4" />}
        label="Lock Screen"
        shortcut="⌃⌘Q"
        onClick={() => {
          onLockScreen();
          onClose();
        }}
      />

      <MenuItem
        icon={<LogOut className="w-4 h-4" />}
        label="Log Out Alana Goyal..."
        shortcut="⇧⌘Q"
        onClick={() => {
          onLogout();
          onClose();
        }}
      />
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
      className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
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
