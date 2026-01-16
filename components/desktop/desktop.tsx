"use client";

import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP } from "@/lib/window-context";
import { SystemSettingsProvider, useSystemSettings } from "@/lib/system-settings-context";
import { RecentsProvider } from "@/lib/recents-context";
import { FileMenuProvider } from "@/lib/file-menu-context";
import { useTextEditWindows } from "@/lib/use-textedit-windows";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp, type SidebarItem as FinderTab } from "@/components/apps/finder/finder-app";
import { PhotosApp } from "@/components/apps/photos/photos-app";
import { TextEditWindow } from "@/components/apps/textedit";
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
  initialTextEditFile?: string;
}

function DesktopContent({ initialNoteSlug, initialTextEditFile }: { initialNoteSlug?: string; initialTextEditFile?: string }) {
  const { openWindow, focusWindow, restoreWindow, getWindow, restoreDesktopDefault, state } = useWindowManager();
  const { focusMode, currentOS } = useSystemSettings();
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);
  const [finderTab, setFinderTab] = useState<FinderTab>("recents");

  // TextEdit window management via custom hook
  const textEdit = useTextEditWindows({ initialTextEditFile });

  // Cmd+W keyboard shortcut to close focused TextEdit window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w" && e.metaKey && textEdit.focusedWindowId) {
        e.preventDefault();
        textEdit.handleClose(textEdit.focusedWindowId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [textEdit.focusedWindowId, textEdit]);

  // Update URL when focused window changes
  useEffect(() => {
    const focusedAppId = state.focusedWindowId;

    // If a TextEdit window is focused, update URL to that file
    if (textEdit.focusedWindowId && textEdit.focusedWindow) {
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(textEdit.focusedWindow.filePath)}`);
      return;
    }

    if (!focusedAppId) return;

    // Update URL based on which app is now focused
    if (focusedAppId === "notes") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      }
    } else {
      window.history.replaceState(null, "", `/${focusedAppId}`);
    }
  }, [state.focusedWindowId, textEdit.focusedWindowId, textEdit.focusedWindow, initialNoteSlug]);

  const isActive = mode === "active";

  // URL update handlers
  const handleMessagesFocus = useCallback(() => {
    textEdit.clearFocus();
    window.history.replaceState(null, "", "/messages");
  }, [textEdit]);

  const handleNotesFocus = useCallback(() => {
    textEdit.clearFocus();
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/notes/")) {
      const slug = initialNoteSlug || "about-me";
      window.history.replaceState(null, "", `/notes/${slug}`);
    }
  }, [initialNoteSlug, textEdit]);

  const handleSettingsFocus = useCallback(() => {
    textEdit.clearFocus();
    window.history.replaceState(null, "", "/settings");
  }, [textEdit]);

  const handleITermFocus = useCallback(() => {
    textEdit.clearFocus();
    window.history.replaceState(null, "", "/iterm");
  }, [textEdit]);

  const handleFinderFocus = useCallback(() => {
    textEdit.clearFocus();
    window.history.replaceState(null, "", "/finder");
  }, [textEdit]);

  const handlePhotosFocus = useCallback(() => {
    textEdit.clearFocus();
    window.history.replaceState(null, "", "/photos");
  }, [textEdit]);

  // Handler for focusing a TextEdit window (with URL update)
  const handleTextEditWindowFocus = useCallback((windowId: string) => {
    const targetWindow = textEdit.windows.find(w => w.id === windowId);
    if (targetWindow) {
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(targetWindow.filePath)}`);
    }
    textEdit.handleFocus(windowId);
  }, [textEdit]);

  // Handler for opening text files in TextEdit (with URL update)
  const handleOpenTextFile = useCallback((filePath: string, content: string) => {
    textEdit.handleOpen(filePath, content);
    window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(filePath)}`);
  }, [textEdit]);

  // Handler for closing a TextEdit window (with URL update)
  const handleTextEditWindowClose = useCallback((windowId: string) => {
    const newVisibleWindows = textEdit.visibleWindows.filter(w => w.id !== windowId);
    textEdit.handleClose(windowId);

    // Update URL after close
    if (textEdit.focusedWindowId === windowId && newVisibleWindows.length > 0) {
      const nextFocused = newVisibleWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(nextFocused.filePath)}`);
    }
  }, [textEdit]);

  // Handler for TextEdit dock click (with URL update)
  const handleTextEditDockClick = useCallback(() => {
    if (textEdit.windows.length === 0) return;
    // Get the window that will be focused/restored
    const minimizedWindows = textEdit.windows.filter(w => w.isMinimized);
    if (minimizedWindows.length > 0) {
      const toRestore = minimizedWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(toRestore.filePath)}`);
    } else if (textEdit.visibleWindows.length > 0) {
      const frontmostWindow = textEdit.visibleWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(frontmostWindow.filePath)}`);
    }
    textEdit.handleDockClick();
  }, [textEdit]);

  // Handler for Finder dock icon click - resets to Recents view
  const handleFinderDockClick = useCallback(() => {
    setFinderTab("recents");
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
            <ITermApp inShell={true} onOpenTextFile={handleOpenTextFile} />
          </Window>

          <Window appId="finder" onFocus={handleFinderFocus}>
            <FinderApp inShell={true} onOpenApp={handleOpenApp} onOpenTextFile={handleOpenTextFile} initialTab={finderTab} />
          </Window>

          <Window appId="photos" onFocus={handlePhotosFocus}>
            <PhotosApp inShell={true} />
          </Window>

          {/* TextEdit windows - each file gets its own window (only visible ones) */}
          {textEdit.visibleWindows.map((win) => (
            <TextEditWindow
              key={win.id}
              filePath={win.filePath}
              content={win.content}
              position={win.position}
              size={win.size}
              zIndex={win.zIndex}
              isFocused={textEdit.focusedWindowId === win.id}
              isMaximized={win.isMaximized}
              onFocus={() => handleTextEditWindowFocus(win.id)}
              onClose={() => handleTextEditWindowClose(win.id)}
              onMinimize={() => textEdit.handleMinimize(win.id)}
              onToggleMaximize={() => textEdit.handleToggleMaximize(win.id)}
              onMove={(pos) => textEdit.handleMove(win.id, pos)}
              onResize={(size, pos) => textEdit.handleResize(win.id, size, pos)}
              onContentChange={(content) => textEdit.handleContentChange(win.id, content)}
            />
          ))}

          <Dock onTrashClick={handleTrashClick} onFinderClick={handleFinderDockClick} onTextEditClick={handleTextEditDockClick} hasOpenTextEditWindows={textEdit.hasOpenWindows} />
        </>
      )}

      {mode === "locked" && <LockScreen onUnlock={handleUnlock} />}
      {mode === "sleeping" && <SleepOverlay onWake={handleWake} />}
      {mode === "shuttingDown" && <ShutdownOverlay onBootComplete={handleBootComplete} />}
      {mode === "restarting" && <RestartOverlay onBootComplete={handleBootComplete} />}
    </div>
  );
}

export function Desktop({ initialAppId, initialNoteSlug, initialTextEditFile }: DesktopProps) {
  return (
    <SystemSettingsProvider>
      <RecentsProvider>
        <FileMenuProvider>
          <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
            <DesktopContent initialNoteSlug={initialNoteSlug} initialTextEditFile={initialTextEditFile} />
          </WindowManagerProvider>
        </FileMenuProvider>
      </RecentsProvider>
    </SystemSettingsProvider>
  );
}
