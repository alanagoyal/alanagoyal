"use client";

import { useEffect, useState, useRef } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { faWifi, faBatteryFull, faMagnifyingGlass, faSliders } from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Settings,
  Moon,
  RotateCcw,
  Power,
  Lock,
  LogOut,
} from "lucide-react";

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

function AppleMenu({
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-7 left-2 w-64 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl shadow-2xl border border-black/10 dark:border-white/10 py-1 z-[1000] overflow-hidden"
    >
      {/* About This Mac */}
      <button
        onClick={() => {
          onAboutThisMac();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <Monitor className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>About This Mac</span>
      </button>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      {/* System Settings */}
      <button
        onClick={() => {
          onSystemSettings();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <Settings className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>System Settings...</span>
      </button>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      {/* Sleep */}
      <button
        onClick={() => {
          onSleep();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <Moon className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>Sleep</span>
      </button>

      {/* Restart */}
      <button
        onClick={() => {
          onRestart();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>Restart...</span>
      </button>

      {/* Shut Down */}
      <button
        onClick={() => {
          onShutdown();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <Power className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>Shut Down...</span>
      </button>

      <div className="my-1 border-t border-black/10 dark:border-white/10" />

      {/* Lock Screen */}
      <button
        onClick={() => {
          onLockScreen();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <Lock className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>Lock Screen</span>
        <span className="ml-auto text-xs text-muted-foreground group-hover:text-white/70">⌃⌘Q</span>
      </button>

      {/* Log Out */}
      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-white" />
        <span>Log Out Alana Goyal...</span>
        <span className="ml-auto text-xs text-muted-foreground group-hover:text-white/70">⇧⌘Q</span>
      </button>
    </div>
  );
}

interface MenuBarProps {
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

export function MenuBar({
  onOpenSettings,
  onOpenAbout,
  onSleep,
  onRestart,
  onShutdown,
  onLockScreen,
  onLogout,
}: MenuBarProps) {
  const { getFocusedAppId } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isAppleMenuOpen, setIsAppleMenuOpen] = useState(false);

  const focusedAppId = getFocusedAppId();
  const focusedApp = focusedAppId ? getAppById(focusedAppId) : null;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
      const month = now.toLocaleDateString("en-US", { month: "short" });
      const day = now.getDate();
      const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      setCurrentTime(`${weekday} ${month} ${day} ${time}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-7 bg-white/20 dark:bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50 select-none">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsAppleMenuOpen(!isAppleMenuOpen)}
          className={cn(
            "flex items-center justify-center w-6 h-5 -ml-1 rounded transition-colors",
            isAppleMenuOpen ? "bg-blue-500" : "hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon
            icon={faApple as IconProp}
            className={cn(
              "w-4 h-4",
              isAppleMenuOpen ? "text-white" : "text-black dark:text-white"
            )}
          />
        </button>
        <span className="text-sm font-semibold text-black dark:text-white">
          {focusedApp?.menuBarTitle || "Finder"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faBatteryFull} className="w-5 h-3.5 text-black dark:text-white" />
        <FontAwesomeIcon icon={faWifi} className="w-4 h-4 text-black dark:text-white" />
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-black dark:text-white" />
        <FontAwesomeIcon icon={faSliders} className="w-4 h-4 text-black dark:text-white" />
        <span className="text-sm text-black dark:text-white">{currentTime}</span>
      </div>

      <AppleMenu
        isOpen={isAppleMenuOpen}
        onClose={() => setIsAppleMenuOpen(false)}
        onAboutThisMac={() => onOpenAbout?.()}
        onSystemSettings={() => onOpenSettings?.()}
        onSleep={() => onSleep?.()}
        onRestart={() => onRestart?.()}
        onShutdown={() => onShutdown?.()}
        onLockScreen={() => onLockScreen?.()}
        onLogout={() => onLogout?.()}
      />
    </div>
  );
}
