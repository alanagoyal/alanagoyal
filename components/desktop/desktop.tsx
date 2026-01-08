"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager } from "@/lib/window-context";
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
import type { SettingsPanel } from "@/components/apps/settings/settings-app";

interface DesktopProps {
  initialAppId?: string; // App to open and focus on load
  initialNoteSlug?: string; // For notes app: which note to select
}

// Inner component that uses the window manager context
function DesktopContent({ initialNoteSlug }: { initialNoteSlug?: string }) {
  const { openWindow, restoreDesktopDefault } = useWindowManager();
  const [isLocked, setIsLocked] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [fromLogout, setFromLogout] = useState(false); // Track if we came from logout

  // Update URL when messages window is focused
  const handleMessagesFocus = useCallback(() => {
    window.history.replaceState(null, "", "/messages");
  }, []);

  // Update URL when notes window is focused - preserve current note or use initial
  const handleNotesFocus = useCallback(() => {
    // If already on a notes URL, keep it; otherwise use initial or default
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/notes/")) {
      const slug = initialNoteSlug || "about-me";
      window.history.replaceState(null, "", `/notes/${slug}`);
    }
  }, [initialNoteSlug]);

  // Update URL when settings window is focused
  const handleSettingsFocus = useCallback(() => {
    window.history.replaceState(null, "", "/settings");
  }, []);

  // Menu bar handlers
  const handleOpenSettings = useCallback(() => {
    setSettingsPanel(null); // Reset to default view
    openWindow("settings");
    window.history.replaceState(null, "", "/settings");
  }, [openWindow]);

  const handleOpenAbout = useCallback(() => {
    setSettingsPanel("about"); // Navigate to About panel
    openWindow("settings");
    window.history.replaceState(null, "", "/settings");
  }, [openWindow]);

  const handleSleep = useCallback(() => {
    setIsSleeping(true);
  }, []);

  const handleWake = useCallback(() => {
    setIsSleeping(false);
    setIsLocked(true); // Wake up to lock screen
  }, []);

  const handleShutdown = useCallback(() => {
    setIsShuttingDown(true);
  }, []);

  // Called when shutdown/restart boot sequence completes
  const handleBootComplete = useCallback(() => {
    setIsShuttingDown(false);
    setIsRestarting(false);
    setFromLogout(true); // Show desktop default after login
    setIsLocked(true);
  }, []);

  const handleRestart = useCallback(() => {
    setIsRestarting(true);
  }, []);

  const handleLockScreen = useCallback(() => {
    setIsLocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    if (fromLogout) {
      restoreDesktopDefault();
      setFromLogout(false);
    }
  }, [fromLogout, restoreDesktopDefault]);

  const handleLogout = useCallback(() => {
    setFromLogout(true);
    setIsLocked(true);
  }, []);

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
        onOpenAbout={handleOpenAbout}
        onSleep={handleSleep}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
        onLockScreen={handleLockScreen}
        onLogout={handleLogout}
      />

      {/* Hide windows when locked, sleeping, shut down, or restarting */}
      {!isLocked && !isSleeping && !isShuttingDown && !isRestarting && (
        <>
          <Window appId="notes" onFocus={handleNotesFocus}>
            <NotesApp inShell={true} initialSlug={initialNoteSlug} />
          </Window>

          <Window appId="messages" onFocus={handleMessagesFocus}>
            <MessagesApp inShell={true} />
          </Window>

          <Window appId="settings" onFocus={handleSettingsFocus}>
            <SettingsApp inShell={true} initialPanel={settingsPanel} />
          </Window>

          <Dock />
        </>
      )}

      {isLocked && <LockScreen onUnlock={handleUnlock} />}
      {isSleeping && <SleepOverlay onWake={handleWake} />}
      {isShuttingDown && <ShutdownOverlay onBootComplete={handleBootComplete} />}
      {isRestarting && <RestartOverlay onBootComplete={handleBootComplete} />}
    </div>
  );
}

export function Desktop({ initialAppId, initialNoteSlug }: DesktopProps) {
  return (
    <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
      <DesktopContent initialNoteSlug={initialNoteSlug} />
    </WindowManagerProvider>
  );
}
