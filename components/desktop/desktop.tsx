"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
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
import { PreviewWindow, PREVIEW_TITLE_BAR_HEIGHT, type PreviewFileType } from "@/components/apps/preview";
import { useMobileDetect } from "@/components/apps/notes/mobile-detector";
import { LockScreen } from "./lock-screen";
import { SleepOverlay } from "./sleep-overlay";
import { ShutdownOverlay } from "./shutdown-overlay";
import { RestartOverlay } from "./restart-overlay";
import { getWallpaperPath } from "@/lib/os-versions";
import type { SettingsPanel, SettingsCategory } from "@/components/apps/settings/settings-app";
import { getTextEditContent, saveTextEditContent } from "@/lib/file-storage";

type DesktopMode = "active" | "locked" | "sleeping" | "shuttingDown" | "restarting";

interface DesktopProps {
  initialAppId?: string;
  initialNoteSlug?: string;
  initialTextEditFile?: string;
  initialPreviewFile?: string;
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

// Calculate optimal window size for an image based on its dimensions
function calculateImageWindowSize(
  naturalWidth: number,
  naturalHeight: number
): { width: number; height: number } {
  const minWidth = 400;
  const minContentHeight = 300 - PREVIEW_TITLE_BAR_HEIGHT;
  const maxContentWidth = Math.min(1200, window.innerWidth - 200);
  const maxContentHeight = Math.min(900, window.innerHeight - 200) - PREVIEW_TITLE_BAR_HEIGHT;

  let contentWidth = naturalWidth;
  let contentHeight = naturalHeight;

  if (contentWidth > maxContentWidth || contentHeight > maxContentHeight) {
    const scale = Math.min(maxContentWidth / contentWidth, maxContentHeight / contentHeight);
    contentWidth = Math.round(contentWidth * scale);
    contentHeight = Math.round(contentHeight * scale);
  }

  contentWidth = Math.max(contentWidth, minWidth);
  contentHeight = Math.max(contentHeight, minContentHeight);

  return {
    width: contentWidth,
    height: contentHeight + PREVIEW_TITLE_BAR_HEIGHT,
  };
}

// Load image and calculate optimal window size
function loadImageAndGetSize(
  fileUrl: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve(calculateImageWindowSize(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      resolve(null); // Return null on error, caller will use default size
    };
    img.src = fileUrl;
  });
}

function DesktopContent({ initialNoteSlug, initialTextEditFile, initialPreviewFile }: { initialNoteSlug?: string; initialTextEditFile?: string; initialPreviewFile?: string }) {
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
  // Get TextEdit and Preview windows from window manager
  const textEditWindows = getWindowsByApp("textedit");
  const previewWindows = getWindowsByApp("preview");

  // Memoize filtered/sorted windows to avoid recomputing on every render
  const visibleTextEditWindows = useMemo(
    () =>
      textEditWindows
        .filter((w) => w.isOpen && !w.isMinimized && w.metadata?.filePath)
        .sort((a, b) => b.zIndex - a.zIndex)
        .slice(0, isMobile ? 1 : undefined),
    [textEditWindows, isMobile]
  );

  const visiblePreviewWindows = useMemo(
    () =>
      previewWindows
        .filter((w) => w.isOpen && !w.isMinimized && w.metadata?.filePath)
        .sort((a, b) => b.zIndex - a.zIndex)
        .slice(0, isMobile ? 1 : undefined),
    [previewWindows, isMobile]
  );

  // Track whether we've processed the URL file parameters
  const [urlFileProcessed, setUrlFileProcessed] = useState(!initialTextEditFile);
  const [urlPreviewProcessed, setUrlPreviewProcessed] = useState(!initialPreviewFile);

  // Memoize the check for existing window to avoid effect re-runs
  const existingTextEditWindow = initialTextEditFile
    ? textEditWindows.find((w) => w.instanceId === initialTextEditFile)
    : null;
  const existingWindowId = existingTextEditWindow?.id;

  // Open TextEdit file from URL on mount (only once)
  useEffect(() => {
    if (urlFileProcessed || !initialTextEditFile) return;

    if (existingWindowId) {
      // Window already exists (restored from sessionStorage) - don't re-focus to preserve z-order
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

  // Open Preview file from URL on mount (only once)
  const existingPreviewWindow = initialPreviewFile
    ? previewWindows.find((w) => w.instanceId === initialPreviewFile)
    : null;
  const existingPreviewWindowId = existingPreviewWindow?.id;

  useEffect(() => {
    if (urlPreviewProcessed || !initialPreviewFile) return;

    if (existingPreviewWindowId) {
      // Window already exists (restored from sessionStorage) - don't re-focus to preserve z-order
      setUrlPreviewProcessed(true);
      return;
    }

    // Parse the file path to get URL and type
    if (initialPreviewFile.startsWith(PROJECTS_DIR + "/")) {
      const relativePath = initialPreviewFile.slice(PROJECTS_DIR.length + 1);
      const parts = relativePath.split("/");
      const repo = parts[0];
      const repoPath = parts.slice(1).join("/");
      const fileUrl = `https://raw.githubusercontent.com/alanagoyal/${repo}/main/${repoPath}`;
      const ext = initialPreviewFile.split(".").pop()?.toLowerCase() || "";
      const fileType: PreviewFileType = ext === "pdf" ? "pdf" : "image";

      if (fileType === "pdf") {
        openMultiWindow("preview", initialPreviewFile, {
          filePath: initialPreviewFile,
          fileUrl,
          fileType,
        });
        setUrlPreviewProcessed(true);
      } else {
        // For images, load to get dimensions first
        loadImageAndGetSize(fileUrl).then((size) => {
          openMultiWindow(
            "preview",
            initialPreviewFile,
            { filePath: initialPreviewFile, fileUrl, fileType },
            size ?? undefined
          );
          setUrlPreviewProcessed(true);
        });
      }
    } else {
      setUrlPreviewProcessed(true);
    }
  }, [initialPreviewFile, urlPreviewProcessed, existingPreviewWindowId, focusMultiWindow, openMultiWindow]);

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
    } else if (focusedAppId === "preview") {
      // For Preview, include the file path in URL
      const windowState = state.windows[focusedWindowId];
      const filePath = windowState?.metadata?.filePath as string;
      if (filePath) {
        window.history.replaceState(null, "", `/preview?file=${encodeURIComponent(filePath)}`);
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

  // Handler for opening preview files (images and PDFs) in Preview
  const handleOpenPreviewFile = useCallback(
    (filePath: string, fileUrl: string, fileType: PreviewFileType) => {
      if (fileType === "pdf") {
        openMultiWindow("preview", filePath, { filePath, fileUrl, fileType });
        return;
      }

      // For images, load to get dimensions first
      loadImageAndGetSize(fileUrl).then((size) => {
        openMultiWindow("preview", filePath, { filePath, fileUrl, fileType }, size ?? undefined);
      });
    },
    [openMultiWindow]
  );

  // Handler for Finder dock icon click - focuses existing window or opens new one at Recents
  const handleFinderDockClick = useCallback(() => {
    const windowState = getWindow("finder");
    if (windowState?.isOpen) {
      // Window exists - just focus it without changing the current view
      if (windowState.isMinimized) {
        restoreWindow("finder");
      } else {
        focusWindow("finder");
      }
    } else {
      // No window open - open fresh at Recents
      setFinderTab("recents");
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
            <FinderApp inShell={true} onOpenApp={handleOpenApp} onOpenTextFile={handleOpenTextFile} onOpenPreviewFile={handleOpenPreviewFile} initialTab={finderTab} />
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
          {visibleTextEditWindows.map((windowState) => {
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

          {/* Preview - multi-window support for images and PDFs */}
          {visiblePreviewWindows.map((windowState) => {
              const filePath = windowState.metadata!.filePath as string;
              const fileUrl = windowState.metadata!.fileUrl as string;
              const fileType = windowState.metadata!.fileType as PreviewFileType;
              const zoom = (windowState.metadata?.zoom as number) ?? 1;
              const scrollLeft = (windowState.metadata?.scrollLeft as number) ?? 0;
              const scrollTop = (windowState.metadata?.scrollTop as number) ?? 0;
              return (
                <PreviewWindow
                  key={windowState.id}
                  filePath={filePath}
                  fileUrl={fileUrl}
                  fileType={fileType}
                  position={windowState.position}
                  size={windowState.size}
                  zIndex={windowState.zIndex}
                  isFocused={state.focusedWindowId === windowState.id}
                  isMaximized={windowState.isMaximized}
                  initialZoom={zoom}
                  initialScrollLeft={scrollLeft}
                  initialScrollTop={scrollTop}
                  onFocus={() => focusMultiWindow(windowState.id)}
                  onClose={() => closeMultiWindow(windowState.id)}
                  onMinimize={() => minimizeMultiWindow(windowState.id)}
                  onToggleMaximize={() => toggleMaximizeMultiWindow(windowState.id)}
                  onMove={(pos) => moveMultiWindow(windowState.id, pos)}
                  onResize={(size, pos) => resizeMultiWindow(windowState.id, size, pos)}
                  onZoomChange={(newZoom) => updateWindowMetadata(windowState.id, { zoom: newZoom })}
                  onScrollChange={(left, top) => updateWindowMetadata(windowState.id, { scrollLeft: left, scrollTop: top })}
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

export function Desktop({ initialAppId, initialNoteSlug, initialTextEditFile, initialPreviewFile }: DesktopProps) {
  return (
    <RecentsProvider>
      <FileMenuProvider>
        <WindowManagerProvider key={initialAppId || "default"} initialAppId={initialAppId}>
          <DesktopContent initialNoteSlug={initialNoteSlug} initialTextEditFile={initialTextEditFile} initialPreviewFile={initialPreviewFile} />
        </WindowManagerProvider>
      </FileMenuProvider>
    </RecentsProvider>
  );
}
