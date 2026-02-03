"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP, getAppIdFromWindowId } from "@/lib/window-context";
import { useSystemSettings } from "@/lib/system-settings-context";
import { RecentsProvider, useRecents } from "@/lib/recents-context";
import { FileMenuProvider } from "@/lib/file-menu-context";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp, type SidebarItem as FinderTab } from "@/components/apps/finder/finder-app";
import { PhotosApp } from "@/components/apps/photos/photos-app";
import { CalendarApp } from "@/components/apps/calendar/calendar-app";
import { MusicApp } from "@/components/apps/music/music-app";
import { TextEditWindow } from "@/components/apps/textedit";
import { useMobileDetect } from "@/components/apps/notes/mobile-detector";
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

import { getTextEditContent, saveTextEditContent } from "@/lib/file-storage";

// Constants for file paths
const HOME_DIR = "/Users/alanagoyal";
const PROJECTS_DIR = `${HOME_DIR}/Projects`;

// Fetch file content from GitHub API
async function fetchFileContentFromGitHub(repo: string, path: string): Promise<string> {
  try {
    const response = await fetch(
      `/api/github?type=file&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
    );
    if (!response.ok) throw new Error("Failed to fetch file");
    const data = await response.json();
    return data.content;
  } catch {
    return "";
  }
}

// Fetch file content given a full path
async function fetchFileContent(filePath: string): Promise<string> {
  if (filePath.startsWith(PROJECTS_DIR + "/")) {
    const relativePath = filePath.slice(PROJECTS_DIR.length + 1);
    const parts = relativePath.split("/");
    const repo = parts[0];
    const repoFilePath = parts.slice(1).join("/");
    return fetchFileContentFromGitHub(repo, repoFilePath);
  }
  if (filePath === `${HOME_DIR}/Desktop/hello.md`) {
    return "hello world!";
  }
  return "";
}

function DesktopContent({ initialNoteSlug, initialTextEditFile }: { initialNoteSlug?: string; initialTextEditFile?: string }) {
  const {
    openWindow,
    focusWindow,
    restoreWindow,
    getWindow,
    restoreDesktopDefault,
    state,
    // Multi-window methods
    openMultiWindow,
    closeMultiWindow,
    focusMultiWindow,
    minimizeMultiWindow,
    moveMultiWindow,
    resizeMultiWindow,
    toggleMaximizeMultiWindow,
    bringAppToFront,
    updateWindowMetadata,
    getWindowsByApp,
    hasOpenWindows,
    getFocusedAppId,
  } = useWindowManager();
  const { focusMode, currentOS } = useSystemSettings();
  const { touchRecent } = useRecents();
  const isMobile = useMobileDetect();

  // Debounce touchRecent to avoid excessive re-renders
  const touchTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const debouncedTouchRecent = useCallback((path: string) => {
    if (touchTimers.current[path]) clearTimeout(touchTimers.current[path]);
    touchTimers.current[path] = setTimeout(() => {
      touchRecent(path);
      delete touchTimers.current[path];
    }, 500);
  }, [touchRecent]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = touchTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel | undefined>(undefined);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory | undefined>(undefined);
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);
  const [finderTab, setFinderTab] = useState<FinderTab | undefined>(undefined);
  // Get TextEdit windows from window manager
  const textEditWindows = getWindowsByApp("textedit");

  // Track whether we've processed the URL file parameter
  const [urlFileProcessed, setUrlFileProcessed] = useState(!initialTextEditFile);

  // Memoize the check for existing window to avoid effect re-runs
  const existingTextEditWindow = initialTextEditFile
    ? textEditWindows.find((w) => w.instanceId === initialTextEditFile)
    : null;
  const existingWindowId = existingTextEditWindow?.id;

  // Open TextEdit file from URL on mount (only once)
  useEffect(() => {
    if (urlFileProcessed || !initialTextEditFile) return;

    if (existingWindowId) {
      // Window already exists from sessionStorage, just focus it
      focusMultiWindow(existingWindowId);
      setUrlFileProcessed(true);
      return;
    }

    // Window doesn't exist, need to create it
    const cachedContent = getTextEditContent(initialTextEditFile);
    if (cachedContent !== undefined) {
      openMultiWindow("textedit", initialTextEditFile, {
        filePath: initialTextEditFile,
        content: cachedContent,
      });
      setUrlFileProcessed(true);
    } else {
      fetchFileContent(initialTextEditFile).then((content) => {
        openMultiWindow("textedit", initialTextEditFile, {
          filePath: initialTextEditFile,
          content,
        });
        setUrlFileProcessed(true);
      });
    }
  }, [initialTextEditFile, urlFileProcessed, existingWindowId, focusMultiWindow, openMultiWindow]);

  // Update URL when focus changes
  useEffect(() => {
    const focusedWindowId = state.focusedWindowId;
    if (!focusedWindowId) return;

    const focusedAppId = getAppIdFromWindowId(focusedWindowId);

    if (focusedAppId === "textedit") {
      // For TextEdit, include the file path in URL
      const windowState = state.windows[focusedWindowId];
      const filePath = windowState?.metadata?.filePath as string;
      if (filePath) {
        window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(filePath)}`);
      }
    } else if (focusedAppId === "notes") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      }
    } else {
      window.history.replaceState(null, "", `/${focusedAppId}`);
    }
  }, [state.focusedWindowId, state.windows, initialNoteSlug]);

  const isActive = mode === "active";

  // Handler for opening text files in TextEdit
  const handleOpenTextFile = useCallback(
    (filePath: string, content: string) => {
      // Check for cached (edited) content first - preserve user edits
      const cachedContent = getTextEditContent(filePath);
      const contentToUse = cachedContent !== undefined ? cachedContent : content;

      // Only save if no cached version exists (don't overwrite edits)
      if (cachedContent === undefined) {
        saveTextEditContent(filePath, content);
      }

      // Open multi-window (will focus existing if same file already open)
      openMultiWindow("textedit", filePath, { filePath, content: contentToUse });
    },
    [openMultiWindow]
  );

  // Handler for TextEdit dock click - brings all windows to front
  const handleTextEditDockClick = useCallback(() => {
    bringAppToFront("textedit");
  }, [bringAppToFront]);

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
          <Window appId="notes">
            <NotesApp inShell={true} initialSlug={initialNoteSlug} />
          </Window>

          <Window appId="messages">
            <MessagesApp inShell={true} focusModeActive={focusMode !== "off"} />
          </Window>

          <Window appId="settings">
            <SettingsApp inShell={true} initialPanel={settingsPanel} initialCategory={settingsCategory} />
          </Window>

          <Window appId="iterm">
            <ITermApp inShell={true} onOpenTextFile={handleOpenTextFile} />
          </Window>

          <Window appId="finder">
            <FinderApp inShell={true} onOpenApp={handleOpenApp} onOpenTextFile={handleOpenTextFile} initialTab={finderTab} />
          </Window>

          <Window appId="photos">
            <PhotosApp inShell={true} />
          </Window>

          <Window appId="calendar">
            <CalendarApp inShell={true} />
          </Window>

          <Window appId="music">
            <MusicApp />
          </Window>

          {/* TextEdit - multi-window support */}
          {/* On small screens, only show the topmost window */}
          {textEditWindows
            .filter((w) => w.isOpen && !w.isMinimized && w.metadata?.filePath)
            .sort((a, b) => b.zIndex - a.zIndex)
            .slice(0, isMobile ? 1 : undefined)
            .map((windowState) => {
              const filePath = windowState.metadata!.filePath as string;
              const content = (windowState.metadata?.content as string) ?? "";
              return (
                <TextEditWindow
                  key={windowState.id}
                  windowId={windowState.id}
                  filePath={filePath}
                  content={content}
                  position={windowState.position}
                  size={windowState.size}
                  zIndex={windowState.zIndex}
                  isFocused={state.focusedWindowId === windowState.id}
                  isMaximized={windowState.isMaximized}
                  onFocus={() => focusMultiWindow(windowState.id)}
                  onClose={() => closeMultiWindow(windowState.id)}
                  onMinimize={() => minimizeMultiWindow(windowState.id)}
                  onToggleMaximize={() => toggleMaximizeMultiWindow(windowState.id)}
                  onMove={(pos) => moveMultiWindow(windowState.id, pos)}
                  onResize={(size, pos) => resizeMultiWindow(windowState.id, size, pos)}
                  onContentChange={(newContent) => {
                    // Update metadata and save to localStorage
                    updateWindowMetadata(windowState.id, { content: newContent });
                    saveTextEditContent(filePath, newContent);
                    debouncedTouchRecent(filePath);
                  }}
                />
              );
            })}

          <Dock
            onTrashClick={handleTrashClick}
            onFinderClick={handleFinderDockClick}
          />
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
    <RecentsProvider>
      <FileMenuProvider>
        <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
          <DesktopContent initialNoteSlug={initialNoteSlug} initialTextEditFile={initialTextEditFile} />
        </WindowManagerProvider>
      </FileMenuProvider>
    </RecentsProvider>
  );
}
