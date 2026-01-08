"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager } from "@/lib/window-context";
import { SystemSettingsProvider } from "@/lib/system-settings-context";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { LockScreen } from "./lock-screen";
import { SleepOverlay } from "./sleep-overlay";
import { ShutdownOverlay } from "./shutdown-overlay";
import { RestartOverlay } from "./restart-overlay";
import wallpaper from "@/public/desktop/wallpaper.png";
import type { SettingsPanel, SettingsCategory } from "@/components/apps/settings/settings-app";

type DesktopMode = "active" | "locked" | "sleeping" | "shuttingDown" | "restarting";

interface DesktopProps {
  initialAppId?: string;
  initialNoteSlug?: string;
}

function DesktopContent({ initialNoteSlug }: { initialNoteSlug?: string }) {
  const { openWindow, restoreDesktopDefault } = useWindowManager();
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);

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
      // Update URL to match default focused app (messages)
      window.history.replaceState(null, "", "/messages");
    }
  }, [restoreDefaultOnUnlock, restoreDesktopDefault]);

  return (
    <div className="fixed inset-0">
      <Image
        src={wallpaper}
        alt="Desktop wallpaper"
        fill
        className="object-cover -z-10"
        priority
        quality={100}
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
            <MessagesApp inShell={true} />
          </Window>

          <Window appId="settings" onFocus={handleSettingsFocus}>
            <SettingsApp inShell={true} initialPanel={settingsPanel} initialCategory={settingsCategory} />
          </Window>

          <Dock />
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
      <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
        <DesktopContent initialNoteSlug={initialNoteSlug} />
      </WindowManagerProvider>
    </SystemSettingsProvider>
  );
}
