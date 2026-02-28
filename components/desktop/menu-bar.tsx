"use client";

import { useEffect, useState, useCallback } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { faWifi, faBatteryFull, faSliders } from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";
import { AppleMenu } from "./apple-menu";
import { BatteryMenu, WifiMenu, ControlCenterMenu } from "./status-menus";
import { NotificationCenter } from "./notification-center";
import { AppMenu } from "./app-menu";
import { FileMenu } from "./file-menu";
import { AboutDialog } from "./about-dialog";
import { useFileMenuActions } from "@/lib/file-menu-context";

type OpenMenu = "apple" | "appMenu" | "fileMenu" | "battery" | "wifi" | "controlCenter" | "notificationCenter" | null;

interface MenuBarProps {
  onOpenSettings?: () => void;
  onOpenWifiSettings?: () => void;
  onOpenAbout?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
  onOpenMessagesConversation?: (conversationId: string) => void;
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
  onOpenMessagesConversation,
}: MenuBarProps) {
  const fileMenuActions = useFileMenuActions();
  const { getFocusedAppId, closeApp, state, setMenuOpen } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  // Sync menu open state to window context (used to prevent window focus when menu is open)
  useEffect(() => {
    setMenuOpen(!!openMenu);
  }, [openMenu, setMenuOpen]);

  const focusedAppId = getFocusedAppId(); // This returns the base app ID (e.g., "textedit")
  const focusedApp = focusedAppId ? getAppById(focusedAppId) : null;
  const focusedWindowId = state.focusedWindowId; // This is the actual window ID (e.g., "textedit-0")

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

  // Helper to quit the focused app (quits all windows for multi-window apps)
  // Storage is cleared automatically by closeApp → clearAppState
  const quitFocusedApp = useCallback(() => {
    if (!focusedAppId) return;
    closeApp(focusedAppId);
  }, [focusedAppId, closeApp]);

  // Q shortcut to quit the focused app (closes all windows for multi-window apps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Q key when not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Finder can be closed but not quit
      if (e.key.toLowerCase() === "q" && focusedWindowId && focusedAppId !== "finder") {
        e.preventDefault();
        quitFocusedApp();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedWindowId, focusedAppId, quitFocusedApp]);

  const toggleMenu = (menu: OpenMenu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = useCallback(() => setOpenMenu(null), []);

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
        <button
          onClick={() => toggleMenu("appMenu")}
          className={cn(
            "text-sm font-semibold px-2 py-0.5 rounded transition-colors",
            openMenu === "appMenu"
              ? "bg-blue-500 text-white"
              : "text-black dark:text-white hover:bg-white/10"
          )}
        >
          {focusedApp?.menuBarTitle || "Finder"}
        </button>
        {(focusedAppId === "notes" || focusedAppId === "messages") && (
          <button
            onClick={() => toggleMenu("fileMenu")}
            className={cn(
              "text-sm px-2 py-0.5 rounded transition-colors",
              openMenu === "fileMenu"
                ? "bg-blue-500 text-white"
                : "text-black dark:text-white hover:bg-white/10"
            )}
          >
            File
          </button>
        )}
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
        <button
          onClick={() => toggleMenu("notificationCenter")}
          className={cn(
            "text-sm px-2 py-0.5 rounded transition-colors ml-1",
            openMenu === "notificationCenter"
              ? "bg-white/30 dark:bg-white/20"
              : "hover:bg-white/10",
            "text-black dark:text-white"
          )}
        >
          {currentTime}
        </button>
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

      <AppMenu
        isOpen={openMenu === "appMenu"}
        onClose={closeMenu}
        appId={focusedAppId || "finder"}
        appName={focusedApp?.menuBarTitle || "Finder"}
        onAbout={() => setAboutDialogOpen(true)}
        onQuit={quitFocusedApp}
      />

      <FileMenu
        isOpen={openMenu === "fileMenu"}
        onClose={closeMenu}
        appId={focusedAppId || ""}
        onNewNote={fileMenuActions.onNewNote}
        onPinNote={fileMenuActions.onPinNote}
        onDeleteNote={fileMenuActions.onDeleteNote}
        noteIsPinned={fileMenuActions.noteIsPinned}
        onNewChat={fileMenuActions.onNewChat}
        onPinChat={fileMenuActions.onPinChat}
        onHideAlerts={fileMenuActions.onHideAlerts}
        onDeleteChat={fileMenuActions.onDeleteChat}
        chatIsPinned={fileMenuActions.chatIsPinned}
        hideAlertsActive={fileMenuActions.hideAlertsActive}
      />

      <NotificationCenter
        isOpen={openMenu === "notificationCenter"}
        onClose={closeMenu}
        onOpenMessagesConversation={onOpenMessagesConversation}
      />

      <AboutDialog
        isOpen={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        appName={focusedApp?.menuBarTitle || "Finder"}
        appId={focusedAppId || "finder"}
      />
    </div>
  );
}
