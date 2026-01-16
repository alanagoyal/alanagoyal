"use client";

import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP } from "@/lib/window-context";
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

interface TextEditFile {
  path: string;
  content: string;
}

interface TextEditState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  openFilePath?: string;
}

const TEXTEDIT_STATE_KEY = "textedit-window-state";

function loadTextEditState(): TextEditState {
  if (typeof window === "undefined") return { position: { x: 160, y: 90 }, size: { width: 700, height: 500 } };
  try {
    const saved = localStorage.getItem(TEXTEDIT_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.position && parsed.size) return parsed;
    }
  } catch {}
  return { position: { x: 160, y: 90 }, size: { width: 700, height: 500 } };
}

function saveTextEditState(state: Partial<TextEditState>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadTextEditState();
    localStorage.setItem(TEXTEDIT_STATE_KEY, JSON.stringify({ ...existing, ...state }));
  } catch {}
}

function clearTextEditOpenFile(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadTextEditState();
    delete existing.openFilePath;
    localStorage.setItem(TEXTEDIT_STATE_KEY, JSON.stringify(existing));
  } catch {}
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
  const { openWindow, focusWindow, restoreWindow, getWindow, restoreDesktopDefault, state, claimZIndex } = useWindowManager();
  const { focusMode, currentOS } = useSystemSettings();
  const [mode, setMode] = useState<DesktopMode>("active");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const [restoreDefaultOnUnlock, setRestoreDefaultOnUnlock] = useState(false);
  const [finderTab, setFinderTab] = useState<FinderTab>("recents");

  // TextEdit - single file state
  const [textEditFile, setTextEditFile] = useState<TextEditFile | null>(null);
  const [textEditPosition, setTextEditPosition] = useState(() => loadTextEditState().position);
  const [textEditSize, setTextEditSize] = useState(() => loadTextEditState().size);
  const [textEditZIndex, setTextEditZIndex] = useState(0);
  const [textEditFocused, setTextEditFocused] = useState(false);
  const [textEditMaximized, setTextEditMaximized] = useState(false);
  const [textEditInitialized, setTextEditInitialized] = useState(false);

  // Persist TextEdit position/size to localStorage
  useEffect(() => {
    saveTextEditState({ position: textEditPosition, size: textEditSize });
  }, [textEditPosition, textEditSize]);

  // Persist open file path to localStorage
  useEffect(() => {
    if (textEditFile) {
      saveTextEditState({ openFilePath: textEditFile.path });
    }
  }, [textEditFile?.path]);

  const isTextEditOpen = textEditFile !== null;

  // Load file from URL or localStorage on mount (only once)
  useEffect(() => {
    if (textEditInitialized) return;

    // Priority: URL param > localStorage
    const fileToLoad = initialTextEditFile || loadTextEditState().openFilePath;
    if (fileToLoad) {
      setTextEditInitialized(true);
      const isFromUrl = !!initialTextEditFile;
      fetchFileContent(fileToLoad).then(content => {
        setTextEditFile({ path: fileToLoad, content });
        setTextEditZIndex(claimZIndex());

        if (isFromUrl) {
          setTextEditFocused(true);
        } else {
          // Re-focus the currently focused app so it stays above TextEdit
          const focusedAppId = state.focusedWindowId;
          if (focusedAppId) {
            focusWindow(focusedAppId);
          }
        }
      });
    }
  }, [initialTextEditFile, textEditInitialized, claimZIndex, state.focusedWindowId, focusWindow]);

  // Update URL when focus changes
  useEffect(() => {
    // If TextEdit is focused, update URL to that file
    if (textEditFocused && textEditFile) {
      window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(textEditFile.path)}`);
      return;
    }

    const focusedAppId = state.focusedWindowId;
    if (!focusedAppId) return;

    if (focusedAppId === "notes") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/notes/")) {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      }
    } else {
      window.history.replaceState(null, "", `/${focusedAppId}`);
    }
  }, [state.focusedWindowId, textEditFocused, textEditFile, initialNoteSlug]);

  const isActive = mode === "active";

  // Clear TextEdit focus when app window is focused
  const clearTextEditFocus = useCallback(() => {
    setTextEditFocused(false);
  }, []);

  // URL update handlers
  const handleMessagesFocus = useCallback(() => {
    clearTextEditFocus();
    window.history.replaceState(null, "", "/messages");
  }, [clearTextEditFocus]);

  const handleNotesFocus = useCallback(() => {
    clearTextEditFocus();
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/notes/")) {
      window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
    }
  }, [initialNoteSlug, clearTextEditFocus]);

  const handleSettingsFocus = useCallback(() => {
    clearTextEditFocus();
    window.history.replaceState(null, "", "/settings");
  }, [clearTextEditFocus]);

  const handleITermFocus = useCallback(() => {
    clearTextEditFocus();
    window.history.replaceState(null, "", "/iterm");
  }, [clearTextEditFocus]);

  const handleFinderFocus = useCallback(() => {
    clearTextEditFocus();
    window.history.replaceState(null, "", "/finder");
  }, [clearTextEditFocus]);

  const handlePhotosFocus = useCallback(() => {
    clearTextEditFocus();
    window.history.replaceState(null, "", "/photos");
  }, [clearTextEditFocus]);

  // Handler for opening text files in TextEdit
  const handleOpenTextFile = useCallback((filePath: string, content: string) => {
    setTextEditFile({ path: filePath, content });
    setTextEditZIndex(claimZIndex());
    setTextEditFocused(true);
    window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(filePath)}`);
  }, [claimZIndex]);

  // Handler for TextEdit focus
  const handleTextEditFocus = useCallback(() => {
    setTextEditZIndex(claimZIndex());
    setTextEditFocused(true);
  }, [claimZIndex]);

  // Handler for closing TextEdit
  const handleTextEditClose = useCallback(() => {
    setTextEditFile(null);
    setTextEditFocused(false);
    setTextEditMaximized(false);
    clearTextEditOpenFile();
    // Focus the topmost app window and update URL
    const openWindows = Object.values(state.windows)
      .filter(w => w.isOpen && !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex);
    if (openWindows.length > 0) {
      const appId = openWindows[0].appId;
      focusWindow(appId);
      if (appId === "notes") {
        window.history.replaceState(null, "", `/notes/${initialNoteSlug || "about-me"}`);
      } else {
        window.history.replaceState(null, "", `/${appId}`);
      }
    }
  }, [state.windows, focusWindow, initialNoteSlug]);

  // Handler for TextEdit dock click
  const handleTextEditDockClick = useCallback(() => {
    if (!textEditFile) return;
    setTextEditZIndex(claimZIndex());
    setTextEditFocused(true);
    window.history.replaceState(null, "", `/textedit?file=${encodeURIComponent(textEditFile.path)}`);
  }, [textEditFile, claimZIndex]);

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

          {/* TextEdit - single file window (minimize closes since there's no dock minimized state) */}
          {textEditFile && (
            <TextEditWindow
              filePath={textEditFile.path}
              content={textEditFile.content}
              position={textEditPosition}
              size={textEditSize}
              zIndex={textEditZIndex}
              isFocused={textEditFocused}
              isMaximized={textEditMaximized}
              onFocus={handleTextEditFocus}
              onClose={handleTextEditClose}
              onMinimize={handleTextEditClose}
              onToggleMaximize={() => setTextEditMaximized(m => !m)}
              onMove={setTextEditPosition}
              onResize={(size, pos) => {
                setTextEditSize(size);
                if (pos) setTextEditPosition(pos);
              }}
              onContentChange={(content) => setTextEditFile(f => f ? { ...f, content } : null)}
            />
          )}

          <Dock onTrashClick={handleTrashClick} onFinderClick={handleFinderDockClick} onTextEditClick={handleTextEditDockClick} hasOpenTextEditWindows={isTextEditOpen} />
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
