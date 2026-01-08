"use client";

import { useEffect, useState } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { faWifi, faBatteryFull, faSliders } from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";
import { AppleMenu } from "./apple-menu";
import { BatteryMenu, WifiMenu, ControlCenterMenu } from "./status-menus";

type OpenMenu = "apple" | "battery" | "wifi" | "controlCenter" | null;

interface MenuBarProps {
  onOpenSettings?: () => void;
  onOpenWifiSettings?: () => void;
  onOpenAbout?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

export function MenuBar({
  onOpenSettings,
  onOpenWifiSettings,
  onOpenAbout,
  onSleep,
  onRestart,
  onShutdown,
  onLockScreen,
  onLogout,
}: MenuBarProps) {
  const { getFocusedAppId } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

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

  const toggleMenu = (menu: OpenMenu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => setOpenMenu(null);

  return (
    <div className="fixed top-0 left-0 right-0 h-7 bg-white/20 dark:bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-[70] select-none">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleMenu("apple")}
          className={cn(
            "flex items-center justify-center w-6 h-5 -ml-1 rounded transition-colors",
            openMenu === "apple" ? "bg-blue-500" : "hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon
            icon={faApple as IconProp}
            className={cn(
              "w-4 h-4",
              openMenu === "apple" ? "text-white" : "text-black dark:text-white"
            )}
          />
        </button>
        <span className="text-sm font-semibold text-black dark:text-white">
          {focusedApp?.menuBarTitle || "Finder"}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Battery */}
        <button
          onClick={() => toggleMenu("battery")}
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "battery" ? "bg-white/30 dark:bg-white/20" : "hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon icon={faBatteryFull} className="w-5 h-3.5 text-black dark:text-white" />
        </button>

        {/* Wi-Fi */}
        <button
          onClick={() => toggleMenu("wifi")}
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "wifi" ? "bg-white/30 dark:bg-white/20" : "hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon icon={faWifi} className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Control Center */}
        <button
          onClick={() => toggleMenu("controlCenter")}
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "controlCenter" ? "bg-white/30 dark:bg-white/20" : "hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon icon={faSliders} className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Date/Time */}
        <span className="text-sm text-black dark:text-white ml-2">{currentTime}</span>
      </div>

      {/* Menus */}
      <AppleMenu
        isOpen={openMenu === "apple"}
        onClose={closeMenu}
        onAboutThisMac={() => onOpenAbout?.()}
        onSystemSettings={() => onOpenSettings?.()}
        onSleep={() => onSleep?.()}
        onRestart={() => onRestart?.()}
        onShutdown={() => onShutdown?.()}
        onLockScreen={() => onLockScreen?.()}
        onLogout={() => onLogout?.()}
      />

      <BatteryMenu
        isOpen={openMenu === "battery"}
        onClose={closeMenu}
        onOpenSettings={onOpenSettings}
      />

      <WifiMenu
        isOpen={openMenu === "wifi"}
        onClose={closeMenu}
        onOpenWifiSettings={onOpenWifiSettings}
      />

      <ControlCenterMenu
        isOpen={openMenu === "controlCenter"}
        onClose={closeMenu}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}
