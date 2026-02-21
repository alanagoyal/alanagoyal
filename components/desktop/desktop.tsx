"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { WindowManagerProvider, useWindowManager, DESKTOP_DEFAULT_FOCUSED_APP, getAppIdFromWindowId } from "@/lib/window-context";
import { useSystemSettings } from "@/lib/system-settings-context";
import { RecentsProvider, useRecents } from "@/lib/recents-context";
import { FileMenuProvider } from "@/lib/file-menu-context";
import dynamic from "next/dynamic";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { MessagesNotificationBanner } from "./messages-notification-banner";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import type { SidebarItem as FinderTab } from "@/components/apps/finder/finder-app";
import type { PreviewFileType } from "@/components/apps/preview";
import { getPreviewMetadataFromPath, PREVIEW_TITLE_BAR_HEIGHT } from "@/lib/preview-utils";
import { useMobileDetect } from "@/components/apps/notes/mobile-detector";
import { LockScreen } from "./lock-screen";
import { SleepOverlay } from "./sleep-overlay";
import { ShutdownOverlay } from "./shutdown-overlay";
import { RestartOverlay } from "./restart-overlay";
import { getWallpaperPath } from "@/lib/os-versions";
import type { SettingsPanel, SettingsCategory } from "@/components/apps/settings/settings-app";
import { getTextEditContent, saveTextEditContent, cacheTextEditContent } from "@/lib/file-storage";
import { saveMessagesConversation } from "@/lib/sidebar-persistence";
import { setUrl } from "@/lib/set-url";
import { getShellUrlForApp } from "@/lib/shell-routing";
import { fetchGitHubFileContent } from "@/lib/github-client";
import type { MessagesNotificationPayload } from "@/types/messages/notification";
import type { MessagesConversationSelectRequest } from "@/types/messages/selection";

const SettingsApp = dynamic(() => import("@/components/apps/settings/settings-app").then(m => ({ default: m.SettingsApp })));
const ITermApp = dynamic(() => import("@/components/apps/iterm/iterm-app").then(m => ({ default: m.ITermApp })));
const FinderApp = dynamic(() => import("@/components/apps/finder/finder-app").then(m => ({ default: m.FinderApp })));
const PhotosApp = dynamic(() => import("@/components/apps/photos/photos-app").then(m => ({ default: m.PhotosApp })));
const CalendarApp = dynamic(() => import("@/components/apps/calendar/calendar-app").then(m => ({ default: m.CalendarApp })));
const MusicApp = dynamic(() => import("@/components/apps/music/music-app").then(m => ({ default: m.MusicApp })));
const TextEditWindow = dynamic(() => import("@/components/apps/textedit").then(m => ({ default: m.TextEditWindow })));
const PreviewWindow = dynamic(() => import("@/components/apps/preview").then(m => ({ default: m.PreviewWindow })));

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
    return await fetchGitHubFileContent(repo, path);
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
  const [appBadges, setAppBadges] = useState<Record<string, number>>({});
  const [activeNotification, setActiveNotification] = useState<MessagesNotificationPayload | null>(null);
  const [isNotificationHovered, setIsNotificationHovered] = useState(false);
  const [messagesSelectRequest, setMessagesSelectRequest] = useState<MessagesConversationSelectRequest | null>(null);
  const nextMessagesSelectRequestIdRef = useRef(1);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    () => {
      const openPreviewWindows = previewWindows.filter(
        (w) => w.isOpen && !w.isMinimized && w.metadata?.filePath
      );

      if (isMobile) {
        return openPreviewWindows.sort((a, b) => b.zIndex - a.zIndex).slice(0, 1);
      }

      // Keep DOM order stable on desktop. Reordering iframe-backed windows on focus can trigger PDF reloads.
      return openPreviewWindows.sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true })
      );
    },
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

    const previewMetadata = getPreviewMetadataFromPath(initialTextEditFile);
    if (previewMetadata) {
      const { fileUrl, fileType } = previewMetadata;
      if (fileType === "pdf") {
        openMultiWindow("preview", initialTextEditFile, {
          filePath: initialTextEditFile,
          fileUrl,
          fileType,
        });
        setUrlFileProcessed(true);
        return;
      }

      loadImageAndGetSize(fileUrl).then((size) => {
        openMultiWindow(
          "preview",
          initialTextEditFile,
          { filePath: initialTextEditFile, fileUrl, fileType },
          size ?? undefined
        );
        setUrlFileProcessed(true);
      });
      return;
    }

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
  }, [initialTextEditFile, urlFileProcessed, existingWindowId, openMultiWindow]);

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
    const previewMeta = getPreviewMetadataFromPath(initialPreviewFile);
    if (previewMeta) {
      const { fileUrl, fileType } = previewMeta;

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
  }, [initialPreviewFile, urlPreviewProcessed, existingPreviewWindowId, openMultiWindow]);

  // Update URL when focus changes
  useEffect(() => {
    const focusedWindowId = state.focusedWindowId;
    if (!focusedWindowId) {
      setUrl("/");
      return;
    }

    const focusedAppId = getAppIdFromWindowId(focusedWindowId);
    const focusedWindow = state.windows[focusedWindowId];
    const filePath = focusedWindow?.metadata?.filePath as string | undefined;
    const nextUrl = getShellUrlForApp(focusedAppId, {
      context: "desktop",
      currentPathname: window.location.pathname,
      noteSlug: initialNoteSlug,
      filePath,
    });
    if (nextUrl) {
      setUrl(nextUrl);
    }
  }, [state.focusedWindowId, state.windows, initialNoteSlug]);

  const isActive = mode === "active";

  // Handler for opening text files in TextEdit
  const handleOpenTextFile = useCallback(
    (filePath: string, content: string) => {
      // Check for cached (edited) content first - preserve user edits
      const cachedContent = getTextEditContent(filePath);
      const contentToUse = cachedContent !== undefined ? cachedContent : content;

      // Only cache if no cached version exists (don't overwrite edits)
      if (cachedContent === undefined) {
        cacheTextEditContent(filePath, content);
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
    const nextUrl = getShellUrlForApp("finder", { context: "desktop" });
    if (nextUrl) {
      setUrl(nextUrl);
    }
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
    const nextUrl = getShellUrlForApp("finder", { context: "desktop" });
    if (nextUrl) {
      setUrl(nextUrl);
    }
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
    const nextUrl = getShellUrlForApp(appId, {
      context: "desktop",
      currentPathname: window.location.pathname,
      noteSlug: initialNoteSlug,
    });
    if (nextUrl) {
      setUrl(nextUrl);
    }
  }, [getWindow, restoreWindow, focusWindow, openWindow, initialNoteSlug]);

  // Menu bar handlers
  const handleOpenSettings = useCallback(() => {
    setSettingsCategory("general");
    setSettingsPanel(null);
    openWindow("settings");
    const nextUrl = getShellUrlForApp("settings", { context: "desktop" });
    if (nextUrl) {
      setUrl(nextUrl);
    }
  }, [openWindow]);

  const handleOpenWifiSettings = useCallback(() => {
    setSettingsCategory("wifi");
    setSettingsPanel(null);
    openWindow("settings");
    const nextUrl = getShellUrlForApp("settings", { context: "desktop" });
    if (nextUrl) {
      setUrl(nextUrl);
    }
  }, [openWindow]);

  const handleOpenAbout = useCallback(() => {
    setSettingsCategory("general");
    setSettingsPanel("about");
    openWindow("settings");
    const nextUrl = getShellUrlForApp("settings", { context: "desktop" });
    if (nextUrl) {
      setUrl(nextUrl);
    }
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
      const nextUrl = getShellUrlForApp(DESKTOP_DEFAULT_FOCUSED_APP, {
        context: "desktop",
        noteSlug: initialNoteSlug,
      });
      if (nextUrl) {
        setUrl(nextUrl);
      }
    }
  }, [restoreDefaultOnUnlock, restoreDesktopDefault, initialNoteSlug]);

  const handleMessagesUnreadBadgeChange = useCallback((count: number) => {
    const safeCount = Math.max(0, Math.floor(count));
    setAppBadges((prev) => {
      if ((prev.messages ?? 0) === safeCount) return prev;
      return { ...prev, messages: safeCount };
    });
  }, []);

  const handleMessagesNotification = useCallback((notification: MessagesNotificationPayload) => {
    setActiveNotification(notification);
  }, []);

  const handleNotificationDismiss = useCallback(() => {
    setActiveNotification(null);
    setIsNotificationHovered(false);
  }, []);

  useEffect(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    if (!activeNotification) return;
    if (isNotificationHovered) return;
    notificationTimeoutRef.current = setTimeout(() => {
      setActiveNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  }, [activeNotification, isNotificationHovered]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleNotificationClick = useCallback((notification: MessagesNotificationPayload) => {
    const { conversationId } = notification;
    saveMessagesConversation(conversationId);
    const requestId = nextMessagesSelectRequestIdRef.current++;
    setMessagesSelectRequest({ conversationId, requestId });
    setActiveNotification(null);
    setIsNotificationHovered(false);

    const messagesWindow = getWindow("messages");
    if (messagesWindow?.isOpen) {
      if (messagesWindow.isMinimized) {
        restoreWindow("messages");
      } else {
        focusWindow("messages");
      }
      return;
    }
    openWindow("messages");
  }, [getWindow, restoreWindow, focusWindow, openWindow]);

  const handleMessagesSelectRequestHandled = useCallback((requestId: number) => {
    setMessagesSelectRequest((prev) => {
      if (!prev || prev.requestId !== requestId) return prev;
      return null;
    });
  }, []);

  return (
    <div className="fixed inset-0" data-shell="desktop">
      <Image
        src={getWallpaperPath(currentOS.id)}
        alt="Desktop wallpaper"
        fill
        className="object-cover -z-10"
        priority
        quality={90}
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

          <Window appId="messages" keepMountedWhenMinimized={true}>
            <MessagesApp
              inShell={true}
              focusModeActive={focusMode !== "off"}
              onUnreadBadgeCountChange={handleMessagesUnreadBadgeChange}
              onNotification={handleMessagesNotification}
              externalSelectConversationRequest={messagesSelectRequest}
              onExternalSelectRequestHandled={handleMessagesSelectRequestHandled}
            />
          </Window>

          <Window appId="settings">
            <SettingsApp inShell={true} initialPanel={settingsPanel} initialCategory={settingsCategory} />
          </Window>

          <Window appId="iterm">
            <ITermApp inShell={true} onOpenTextFile={handleOpenTextFile} />
          </Window>

          <Window appId="finder" keepMountedWhenMinimized={true}>
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
            appBadges={appBadges}
          />
          <MessagesNotificationBanner
            notification={activeNotification}
            onClick={handleNotificationClick}
            onDismiss={handleNotificationDismiss}
            onHoverChange={setIsNotificationHovered}
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
