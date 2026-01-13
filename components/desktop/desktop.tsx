"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP } from "@/lib/window-context";
import { SystemSettingsProvider, useSystemSettings } from "@/lib/system-settings-context";
import { FileMenuProvider } from "@/lib/file-menu-context";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp, type SidebarItem as FinderTab } from "@/components/apps/finder/finder-app";
import { LockScreen } from "./lock-screen";
import { SleepOverlay } from "./sleep-overlay";
import { ShutdownOverlay } from "./shutdown-overlay";
import { RestartOverlay } from "./restart-overlay";
import { getWallpaperPath } from "@/lib/os-versions";
import type { SettingsPanel, SettingsCategory } from "@/components/apps/settings/settings-app";

type DesktopMode = "active" | "locked" | "sleeping" | "shuttingDown" | "restarting";

interface DesktopProps {
  initialAppId?: string;
  initialNoteSlug?: string;
}

function DesktopContent({ initialNoteSlug }: { initialNoteSlug?: string }) {
  const { openWindow, focusWindow, restoreWindow, getWindow, restoreDesktopDefault } = useWindowManager();
  const { focusMode, currentOS } = useSystemSettings();
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);
  const [finderTab, setFinderTab] = useState<FinderTab>("projects");

  const isActive = mode === "active";

  // URL update handlers
  const handleMessagesFocus = useCallback(() => {
    window.history.replaceState(null, "", "/messages");
  }, []);

  const handleNotesFocus = useCallback(() => {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/notes/")) {
      const slug = initialNoteSlug || "about-me";
      window.history.replaceState(null, "", `/notes/${slug}`);
    }
  }, [initialNoteSlug]);

  const handleSettingsFocus = useCallback(() => {
    window.history.replaceState(null, "", "/settings");
  }, []);

  const handleITermFocus = useCallback(() => {
    window.history.replaceState(null, "", "/iterm");
  }, []);

  const handleFinderFocus = useCallback(() => {
    window.history.replaceState(null, "", "/finder");
  }, []);

  // Handler for Finder dock icon click - resets to default projects view
  const handleFinderDockClick = useCallback(() => {
    setFinderTab("projects");
    const windowState = getWindow("finder");
    if (windowState?.isOpen) {
      if (windowState.isMinimized) {
        restoreWindow("finder");
      } else {
        focusWindow("finder");
      }
    } else {
      openWindow("finder");
    }
    window.history.replaceState(null, "", "/finder");
  }, [getWindow, restoreWindow, focusWindow, openWindow]);

  // Handler for Trash dock icon click
  const handleTrashClick = useCallback(() => {
    setFinderTab("trash");
    const windowState = getWindow("finder");
    if (windowState?.isOpen) {
      if (windowState.isMinimized) {
        restoreWindow("finder");
      } else {
        focusWindow("finder");
      }
    } else {
      openWindow("finder");
    }
    window.history.replaceState(null, "", "/finder");
  }, [getWindow, restoreWindow, focusWindow, openWindow]);

  // Handler for opening apps from Finder
  const handleOpenApp = useCallback((appId: string) => {
    const windowState = getWindow(appId);
    if (windowState?.isOpen) {
      if (windowState.isMinimized) {
        restoreWindow(appId);
      } else {
        focusWindow(appId);
      }
    } else {
      openWindow(appId);
    }
    // Update URL based on app
    if (appId === "notes") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      }
    } else {
      window.history.replaceState(null, "", `/${appId}`);
    }
  }, [getWindow, restoreWindow, focusWindow, openWindow, initialNoteSlug]);

  // Menu bar handlers
  const handleOpenSettings = useCallback(() => {
    setSettingsCategory("general");
    setSettingsPanel(null);
    openWindow("settings");
    window.history.replaceState(null, "", "/settings");
  }, [openWindow]);

  const handleOpenWifiSettings = useCallback(() => {
    setSettingsCategory("wifi");
    setSettingsPanel(null);
    openWindow("settings");
    window.history.replaceState(null, "", "/settings");
  }, [openWindow]);

  const handleOpenAbout = useCallback(() => {
    setSettingsCategory("general");
    setSettingsPanel("about");
    openWindow("settings");
    window.history.replaceState(null, "", "/settings");
  }, [openWindow]);

  const handleSleep = useCallback(() => setMode("sleeping"), []);
  const handleRestart = useCallback(() => setMode("restarting"), []);
  const handleShutdown = useCallback(() => setMode("shuttingDown"), []);
  const handleLockScreen = useCallback(() => setMode("locked"), []);

  const handleLogout = useCallback(() => {
    setRestoreDefaultOnUnlock(true);
    setMode("locked");
  }, []);

  const handleWake = useCallback(() => setMode("locked"), []);

  const handleBootComplete = useCallback(() => {
    setRestoreDefaultOnUnlock(true);
    setMode("locked");
  }, []);

  const handleUnlock = useCallback(() => {
    setMode("active");
    if (restoreDefaultOnUnlock) {
      restoreDesktopDefault();
      setRestoreDefaultOnUnlock(false);
      // Update URL to match default focused app
      if (DESKTOP_DEFAULT_FOCUSED_APP === "notes") {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      } else {
        window.history.replaceState(null, "", `/${DESKTOP_DEFAULT_FOCUSED_APP}`);
      }
    }
  }, [restoreDefaultOnUnlock, restoreDesktopDefault, initialNoteSlug]);

  return (
    <div className="fixed inset-0">
      <Image
        src={getWallpaperPath(currentOS.id)}
        alt="Desktop wallpaper"
        fill
        className="object-cover -z-10"
        priority
        quality={100}
        unoptimized
      />
      <MenuBar
        onOpenSettings={handleOpenSettings}
        onOpenWifiSettings={handleOpenWifiSettings}
        onOpenAbout={handleOpenAbout}
        onSleep={handleSleep}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
        onLockScreen={handleLockScreen}
        onLogout={handleLogout}
      />

      {isActive && (
        <>
          <Window appId="notes" onFocus={handleNotesFocus}>
            <NotesApp inShell={true} initialSlug={initialNoteSlug} />
          </Window>

          <Window appId="messages" onFocus={handleMessagesFocus}>
            <MessagesApp inShell={true} focusModeActive={focusMode !== "off"} />
          </Window>

          <Window appId="settings" onFocus={handleSettingsFocus}>
            <SettingsApp inShell={true} initialPanel={settingsPanel} initialCategory={settingsCategory} />
          </Window>

          <Window appId="iterm" onFocus={handleITermFocus}>
            <ITermApp inShell={true} />
          </Window>

          <Window appId="finder" onFocus={handleFinderFocus}>
            <FinderApp inShell={true} onOpenApp={handleOpenApp} initialTab={finderTab} />
          </Window>

          <Dock onTrashClick={handleTrashClick} onFinderClick={handleFinderDockClick} />
        </>
      )}

      {mode === "locked" && <LockScreen onUnlock={handleUnlock} />}
      {mode === "sleeping" && <SleepOverlay onWake={handleWake} />}
      {mode === "shuttingDown" && <ShutdownOverlay onBootComplete={handleBootComplete} />}
      {mode === "restarting" && <RestartOverlay onBootComplete={handleBootComplete} />}
    </div>
  );
}

export function Desktop({ initialAppId, initialNoteSlug }: DesktopProps) {
  return (
    <SystemSettingsProvider>
      <FileMenuProvider>
        <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
          <DesktopContent initialNoteSlug={initialNoteSlug} />
        </WindowManagerProvider>
      </FileMenuProvider>
    </SystemSettingsProvider>
  );
}
