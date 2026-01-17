"use client";

import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP, getAppIdFromWindowId } from "@/lib/window-context";
import { SystemSettingsProvider, useSystemSettings } from "@/lib/system-settings-context";
import { RecentsProvider } from "@/lib/recents-context";
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

// =============================================================================
// TextEdit Content Persistence
// =============================================================================
// File contents are stored separately from window state so they persist
// even when windows are closed and reopened

const TEXTEDIT_CONTENTS_KEY = "textedit-file-contents";

function loadTextEditContents(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(TEXTEDIT_CONTENTS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveTextEditContent(filePath: string, content: string): void {
  if (typeof window === "undefined") return;
  try {
    const contents = loadTextEditContents();
    contents[filePath] = content;
    localStorage.setItem(TEXTEDIT_CONTENTS_KEY, JSON.stringify(contents));
  } catch {}
}

function getTextEditContent(filePath: string): string | undefined {
  const contents = loadTextEditContents();
  return contents[filePath];
}

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
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);
  const [finderTab, setFinderTab] = useState<FinderTab>("recents");
  const [textEditInitialized, setTextEditInitialized] = useState(false);

  // Get TextEdit windows from window manager
  const textEditWindows = getWindowsByApp("textedit");
  const isTextEditOpen = hasOpenWindows("textedit");

  // Load TextEdit file from URL on mount (only once)
  useEffect(() => {
    if (textEditInitialized) return;
    if (!initialTextEditFile) return;

    setTextEditInitialized(true);
    // Check if there's cached content, otherwise fetch
    const cachedContent = getTextEditContent(initialTextEditFile);
    if (cachedContent !== undefined) {
      openMultiWindow("textedit", initialTextEditFile, {
        filePath: initialTextEditFile,
        content: cachedContent,
      });
    } else {
      fetchFileContent(initialTextEditFile).then((content) => {
        openMultiWindow("textedit", initialTextEditFile, {
          filePath: initialTextEditFile,
          content,
        });
      });
    }
  }, [initialTextEditFile, textEditInitialized, openMultiWindow]);

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
        globalThis.window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(filePath)}`);
      }
    } else if (focusedAppId === "notes") {
      const currentPath = globalThis.window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        globalThis.window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      }
    } else {
      globalThis.window.history.replaceState(null, "", `/${focusedAppId}`);
    }
  }, [state.focusedWindowId, state.windows, initialNoteSlug]);

  const isActive = mode === "active";

  // URL update handlers (URL is also updated by the effect above when focus changes)
  const handleMessagesFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  const handleNotesFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  const handleSettingsFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  const handleITermFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  const handleFinderFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  const handlePhotosFocus = useCallback(() => {
    // URL will be updated by the focus change effect
  }, []);

  // Handler for opening text files in TextEdit
  const handleOpenTextFile = useCallback(
    (filePath: string, content: string) => {
      // Save content to localStorage for persistence
      saveTextEditContent(filePath, content);
      // Open multi-window (will focus existing if same file already open)
      openMultiWindow("textedit", filePath, { filePath, content });
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

          {/* TextEdit - multi-window support */}
          {textEditWindows
            .filter((w) => w.isOpen && !w.isMinimized && w.metadata?.filePath)
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
                  onMinimize={() => closeMultiWindow(windowState.id)}
                  onToggleMaximize={() => toggleMaximizeMultiWindow(windowState.id)}
                  onMove={(pos) => moveMultiWindow(windowState.id, pos)}
                  onResize={(size, pos) => resizeMultiWindow(windowState.id, size, pos)}
                  onContentChange={(newContent) => {
                    // Update metadata and save to localStorage
                    updateWindowMetadata(windowState.id, { content: newContent });
                    saveTextEditContent(filePath, newContent);
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
