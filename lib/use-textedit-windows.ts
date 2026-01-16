"use client";

import { useState, useEffect, useCallback } from "react";
import { useWindowManager } from "./window-context";

const TEXTEDIT_STORAGE_KEY = "textedit-open-files";

// Synchronously check if there are stored TextEdit files (for initial render)
function hasStoredTextEditFiles(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(TEXTEDIT_STORAGE_KEY);
    if (!saved) return false;
    const data = JSON.parse(saved);
    const windows = Array.isArray(data) ? data : data.windows;
    return Array.isArray(windows) && windows.length > 0;
  } catch {
    return false;
  }
}

// Constants for file paths
const HOME_DIR = "/Users/alanagoyal";
const PROJECTS_DIR = `${HOME_DIR}/Projects`;

export interface TextEditWindowState {
  id: string;
  filePath: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
}

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
  // Check if it's a GitHub file (in Projects directory)
  if (filePath.startsWith(PROJECTS_DIR + "/")) {
    const relativePath = filePath.slice(PROJECTS_DIR.length + 1);
    const parts = relativePath.split("/");
    const repo = parts[0];
    const repoFilePath = parts.slice(1).join("/");
    return fetchFileContentFromGitHub(repo, repoFilePath);
  }

  // Static file: hello.md on Desktop
  if (filePath === `${HOME_DIR}/Desktop/hello.md`) {
    return "hello world!";
  }

  return "";
}

interface UseTextEditWindowsProps {
  initialTextEditFile?: string;
}

interface UseTextEditWindowsReturn {
  windows: TextEditWindowState[];
  visibleWindows: TextEditWindowState[];
  focusedWindowId: string | null;
  focusedWindow: TextEditWindowState | undefined;
  hasOpenWindows: boolean;
  handleFocus: (windowId: string) => void;
  handleOpen: (filePath: string, content: string) => void;
  handleClose: (windowId: string) => void;
  handleMinimize: (windowId: string) => void;
  handleRestore: (windowId: string) => void;
  handleToggleMaximize: (windowId: string) => void;
  handleMove: (windowId: string, position: { x: number; y: number }) => void;
  handleResize: (windowId: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void;
  handleContentChange: (windowId: string, content: string) => void;
  handleDockClick: () => void;
  clearFocus: () => void;
}

export function useTextEditWindows({ initialTextEditFile }: UseTextEditWindowsProps): UseTextEditWindowsReturn {
  const { claimZIndex, focusWindow, state } = useWindowManager();

  const [windows, setWindows] = useState<TextEditWindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Track if there are stored files (checked synchronously on first render to avoid layout shift)
  // This is true if: there's an initialTextEditFile from URL, OR there are stored files in localStorage
  const [hasStoredFiles] = useState<boolean>(() => {
    return !!initialTextEditFile || hasStoredTextEditFiles();
  });

  // Load TextEdit windows from localStorage on mount
  useEffect(() => {
    async function loadWindows() {
      if (initialized) return;

      try {
        const saved = localStorage.getItem(TEXTEDIT_STORAGE_KEY);
        const savedData: {
          windows: Array<{ filePath: string; position: { x: number; y: number }; size: { width: number; height: number }; zIndex: number; isMaximized?: boolean; isMinimized?: boolean }>;
          focusedFilePath: string | null;
        } = saved ? JSON.parse(saved) : { windows: [], focusedFilePath: null };

        // Handle old format (array) for backwards compatibility
        const savedWindows = Array.isArray(savedData) ? savedData : savedData.windows;
        const savedFocusedFilePath = Array.isArray(savedData) ? null : savedData.focusedFilePath;

        // If there's an initial file from URL, make sure it's included
        if (initialTextEditFile && !savedWindows.some((w: { filePath: string }) => w.filePath === initialTextEditFile)) {
          savedWindows.push({
            filePath: initialTextEditFile,
            position: { x: 160, y: 90 },
            size: { width: 700, height: 500 },
            zIndex: 0,
          });
        }

        if (savedWindows.length === 0) {
          setInitialized(true);
          return;
        }

        // Sort by saved z-index to maintain relative order
        const sortedWindows = [...savedWindows].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        // Fetch content for all windows in parallel
        const contents = await Promise.all(
          sortedWindows.map((saved: { filePath: string }) => fetchFileContent(saved.filePath))
        );

        // Assign z-indexes sequentially AFTER fetching to preserve order
        // (claimZIndex must be called in order, not inside Promise.all)
        const timestamp = Date.now();
        const windowsWithContent = sortedWindows.map((saved: { filePath: string; position: { x: number; y: number }; size: { width: number; height: number }; zIndex?: number; isMaximized?: boolean; isMinimized?: boolean }, index: number) => ({
          id: `textedit-${timestamp}-${index}`,
          filePath: saved.filePath,
          content: contents[index],
          position: saved.position,
          size: saved.size,
          zIndex: claimZIndex(), // Called sequentially in sorted order
          isMaximized: saved.isMaximized ?? false,
          isMinimized: saved.isMinimized ?? false,
        }));

        setWindows(windowsWithContent);

        // Focus: URL file > saved focused file > last window (highest z-index)
        const urlFileWindow = initialTextEditFile
          ? windowsWithContent.find(w => w.filePath === initialTextEditFile)
          : null;
        const savedFocusedWindow = savedFocusedFilePath
          ? windowsWithContent.find(w => w.filePath === savedFocusedFilePath)
          : null;
        const lastWindow = windowsWithContent[windowsWithContent.length - 1];

        const windowToFocus = urlFileWindow || savedFocusedWindow || lastWindow;
        if (windowToFocus) {
          setFocusedWindowId(windowToFocus.id);
        }
      } catch (e) {
        console.error("Failed to load TextEdit windows:", e);
      }

      setInitialized(true);
    }

    loadWindows();
  }, [initialTextEditFile, initialized, claimZIndex]);

  // Save TextEdit windows to localStorage whenever they change
  useEffect(() => {
    if (!initialized) return;

    const focusedWin = windows.find(w => w.id === focusedWindowId);
    const toSave = {
      windows: windows.map(w => ({
        filePath: w.filePath,
        position: w.position,
        size: w.size,
        zIndex: w.zIndex,
        isMaximized: w.isMaximized,
        isMinimized: w.isMinimized,
      })),
      focusedFilePath: focusedWin?.filePath || null,
    };
    localStorage.setItem(TEXTEDIT_STORAGE_KEY, JSON.stringify(toSave));
  }, [windows, focusedWindowId, initialized]);

  const focusedWindow = windows.find(w => w.id === focusedWindowId);

  // Focus a specific TextEdit window
  const handleFocus = useCallback((windowId: string) => {
    const newZIndex = claimZIndex();
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, zIndex: newZIndex } : w
    ));
    setFocusedWindowId(windowId);
  }, [claimZIndex]);

  // Open a text file in TextEdit
  const handleOpen = useCallback((filePath: string, content: string) => {
    // Check if file is already open in a window
    const existingWindow = windows.find(w => w.filePath === filePath);

    if (existingWindow) {
      // If minimized, restore it
      if (existingWindow.isMinimized) {
        setWindows(prev => prev.map(w =>
          w.id === existingWindow.id ? { ...w, isMinimized: false, zIndex: claimZIndex() } : w
        ));
        setFocusedWindowId(existingWindow.id);
      } else {
        handleFocus(existingWindow.id);
      }
    } else {
      const windowId = `textedit-${Date.now()}`;
      const offset = (windows.length % 10) * 30;
      const newZIndex = claimZIndex();
      const newWindow: TextEditWindowState = {
        id: windowId,
        filePath,
        content,
        position: { x: 160 + offset, y: 90 + offset },
        size: { width: 700, height: 500 },
        zIndex: newZIndex,
        isMaximized: false,
        isMinimized: false,
      };

      setWindows(prev => [...prev, newWindow]);
      setFocusedWindowId(windowId);
    }
  }, [windows, claimZIndex, handleFocus]);

  // Close a TextEdit window
  const handleClose = useCallback((windowId: string) => {
    const newWindows = windows.filter(w => w.id !== windowId);
    setWindows(newWindows);

    if (focusedWindowId === windowId) {
      if (newWindows.length > 0) {
        const nextFocused = newWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
        setFocusedWindowId(nextFocused.id);
      } else {
        setFocusedWindowId(null);
        // Find next app to focus
        const openAppWindows = Object.values(state.windows)
          .filter(w => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        if (openAppWindows.length > 0) {
          focusWindow(openAppWindows[0].appId);
        }
      }
    }
  }, [windows, focusedWindowId, state.windows, focusWindow]);

  // Minimize a TextEdit window
  const handleMinimize = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));

    // Focus next window if this was focused
    if (focusedWindowId === windowId) {
      const visibleWindows = windows.filter(w => w.id !== windowId && !w.isMinimized);
      if (visibleWindows.length > 0) {
        const nextFocused = visibleWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
        setFocusedWindowId(nextFocused.id);
      } else {
        setFocusedWindowId(null);
        // Find next app to focus
        const openAppWindows = Object.values(state.windows)
          .filter(w => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        if (openAppWindows.length > 0) {
          focusWindow(openAppWindows[0].appId);
        }
      }
    }
  }, [focusedWindowId, windows, state.windows, focusWindow]);

  // Restore a minimized TextEdit window
  const handleRestore = useCallback((windowId: string) => {
    const newZIndex = claimZIndex();
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, isMinimized: false, zIndex: newZIndex } : w
    ));
    setFocusedWindowId(windowId);
  }, [claimZIndex]);

  // Toggle maximize on a TextEdit window
  const handleToggleMaximize = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  // Move a TextEdit window
  const handleMove = useCallback((windowId: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, position } : w
    ));
  }, []);

  // Resize a TextEdit window
  const handleResize = useCallback((windowId: string, size: { width: number; height: number }, position?: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, size, ...(position && { position }) } : w
    ));
  }, []);

  // Update content of a TextEdit window
  const handleContentChange = useCallback((windowId: string, content: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, content } : w
    ));
  }, []);

  // Handle dock icon click - restore if minimized, focus if visible
  const handleDockClick = useCallback(() => {
    if (windows.length === 0) return;

    // Check if there are any minimized windows
    const minimizedWindows = windows.filter(w => w.isMinimized);
    if (minimizedWindows.length > 0) {
      // Restore the most recently minimized (highest z-index among minimized)
      const toRestore = minimizedWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
      handleRestore(toRestore.id);
      return;
    }

    // Focus the frontmost visible window
    const visibleWins = windows.filter(w => !w.isMinimized);
    if (visibleWins.length > 0) {
      const frontmostWindow = visibleWins.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
      handleFocus(frontmostWindow.id);
    }
  }, [windows, handleFocus, handleRestore]);

  // Clear focus (when an app window is focused)
  const clearFocus = useCallback(() => {
    setFocusedWindowId(null);
  }, []);

  const visibleWindows = windows.filter(w => !w.isMinimized);

  // Use hasStoredFiles for initial render (before async loading completes) to avoid layout shift
  // After initialization, use actual windows state
  const hasOpenWindows = initialized ? windows.length > 0 : hasStoredFiles;

  return {
    windows,
    visibleWindows,
    focusedWindowId,
    focusedWindow,
    hasOpenWindows,
    handleFocus,
    handleOpen,
    handleClose,
    handleMinimize,
    handleRestore,
    handleToggleMaximize,
    handleMove,
    handleResize,
    handleContentChange,
    handleDockClick,
    clearFocus,
  };
}
