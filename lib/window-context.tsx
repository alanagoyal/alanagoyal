"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  WindowState,
  WindowManagerState,
  WindowAction,
  Position,
  Size,
} from "@/types/window";
import { APPS, getAppById } from "./app-config";

const STORAGE_KEY = "desktop-window-state";

function getDefaultWindowState(appId: string): WindowState {
  const app = getAppById(appId);
  if (!app) {
    throw new Error(`Unknown app: ${appId}`);
  }
  return {
    id: appId,
    appId,
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    position: app.defaultPosition,
    size: app.defaultSize,
    zIndex: 0,
  };
}

// =============================================================================
// State Factory Functions
// =============================================================================

// Default app shown to new visitors (used when no initialAppId specified)
const DEFAULT_APP = "notes";

// Desktop default configuration (shown after logout/restart/shutdown)
// Windows listed in z-index order (first = back, last = front)
const DESKTOP_DEFAULT_CONFIG = {
  windows: [
    { appId: "messages", position: { x: 450, y: 30 } },
    { appId: "notes", position: { x: 150, y: 70 } },
  ],
  focusedAppId: "notes",
} as const;

// Export for use in desktop.tsx URL handling
export const DESKTOP_DEFAULT_FOCUSED_APP = DESKTOP_DEFAULT_CONFIG.focusedAppId;

/**
 * Creates a fresh state with all windows closed
 */
function getBaseState(): WindowManagerState {
  const windows: Record<string, WindowState> = {};
  APPS.forEach((app) => {
    windows[app.id] = getDefaultWindowState(app.id);
  });
  return {
    windows,
    focusedWindowId: null,
    nextZIndex: 1,
  };
}

/**
 * New visitor state: single app open in fullscreen
 * Used when a new user visits /messages, /notes, /settings, etc.
 */
function getNewVisitorState(appId: string = DEFAULT_APP): WindowManagerState {
  const state = getBaseState();
  state.windows[appId].isOpen = true;
  state.windows[appId].isMaximized = true;
  state.windows[appId].zIndex = 1;
  state.focusedWindowId = appId;
  state.nextZIndex = 2;
  return state;
}

/**
 * Desktop default state: multiple apps open in windowed mode
 * Used after logout/restart/shutdown to show a "fresh desktop" view
 * Notes in front (left of center), Messages behind (right, peeking out)
 */
function getDesktopDefaultState(): WindowManagerState {
  const state = getBaseState();
  const { windows, focusedAppId } = DESKTOP_DEFAULT_CONFIG;

  windows.forEach(({ appId, position }, index) => {
    state.windows[appId].isOpen = true;
    state.windows[appId].isMaximized = false;
    state.windows[appId].zIndex = index + 1;
    state.windows[appId].position = position;
  });

  state.focusedWindowId = focusedAppId;
  state.nextZIndex = windows.length + 1;
  return state;
}

/**
 * Modifies saved state to focus a specific app (opens it if needed)
 * Used when returning user navigates to a specific app URL
 */
function withFocusedApp(savedState: WindowManagerState, appId: string): WindowManagerState {
  return {
    ...savedState,
    windows: {
      ...savedState.windows,
      [appId]: {
        ...savedState.windows[appId],
        isOpen: true,
        isMinimized: false,
        zIndex: savedState.nextZIndex,
      },
    },
    focusedWindowId: appId,
    nextZIndex: savedState.nextZIndex + 1,
  };
}

function loadStateFromStorage(): WindowManagerState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (parsed.windows && typeof parsed.nextZIndex === "number") {
        // Merge with current APPS config to pick up any new apps
        const mergedWindows: Record<string, WindowState> = { ...parsed.windows };
        APPS.forEach((app) => {
          if (!mergedWindows[app.id]) {
            mergedWindows[app.id] = getDefaultWindowState(app.id);
          }
        });
        return {
          ...parsed,
          windows: mergedWindows,
        };
      }
    }
  } catch (e) {
    console.error("Failed to load window state:", e);
  }
  return null;
}

function saveStateToStorage(state: WindowManagerState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save window state:", e);
  }
}

// Max z-index before we normalize (windows stay in 1-50 range)
// See lib/desktop/z-index.ts for the full layering system
const MAX_Z_INDEX = 50;

// Normalize z-indexes to prevent unbounded growth
function normalizeZIndexes(state: WindowManagerState): WindowManagerState {
  if (state.nextZIndex <= MAX_Z_INDEX) return state;

  // Sort windows by current z-index to preserve order
  const sortedWindows = Object.values(state.windows).sort((a, b) => a.zIndex - b.zIndex);

  // Reassign z-indexes starting from 1
  const newWindows: Record<string, WindowState> = {};
  sortedWindows.forEach((win, index) => {
    newWindows[win.appId] = { ...win, zIndex: index + 1 };
  });

  return {
    ...state,
    windows: newWindows,
    nextZIndex: sortedWindows.length + 1,
  };
}

function windowReducer(
  state: WindowManagerState,
  action: WindowAction
): WindowManagerState {
  // Normalize z-indexes if they've grown too large
  state = normalizeZIndexes(state);

  switch (action.type) {
    case "OPEN_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            isOpen: true,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: appId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "CLOSE_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window) return state;

      // Find next window to focus
      const openWindows = Object.values(state.windows)
        .filter((w) => w.isOpen && w.appId !== appId)
        .sort((a, b) => b.zIndex - a.zIndex);
      const nextFocused = openWindows[0]?.appId || null;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            isOpen: false,
            isMaximized: false,
          },
        },
        focusedWindowId: nextFocused,
      };
    }

    case "MINIMIZE_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window || !window.isOpen) return state;

      // Find next window to focus (non-minimized)
      const openWindows = Object.values(state.windows)
        .filter((w) => w.isOpen && !w.isMinimized && w.appId !== appId)
        .sort((a, b) => b.zIndex - a.zIndex);
      const nextFocused = openWindows[0]?.appId || null;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            isMinimized: true,
          },
        },
        focusedWindowId: nextFocused,
      };
    }

    case "FOCUS_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window || !window.isOpen) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: appId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "MOVE_WINDOW": {
      const { appId, position } = action;
      const window = state.windows[appId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            position,
          },
        },
      };
    }

    case "RESIZE_WINDOW": {
      const { appId, size, position } = action;
      const window = state.windows[appId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            size,
            ...(position && { position }),
          },
        },
      };
    }

    case "MAXIMIZE_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            isMaximized: true,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: appId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "RESTORE_WINDOW": {
      const { appId } = action;
      const window = state.windows[appId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [appId]: {
            ...window,
            isMinimized: false,
            isMaximized: false,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: appId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "RESTORE_STATE": {
      return action.state;
    }

    default:
      return state;
  }
}

interface WindowManagerContextValue {
  state: WindowManagerState;
  openWindow: (appId: string) => void;
  closeWindow: (appId: string) => void;
  focusWindow: (appId: string) => void;
  moveWindow: (appId: string, position: Position) => void;
  resizeWindow: (appId: string, size: Size, position?: Position) => void;
  minimizeWindow: (appId: string) => void;
  maximizeWindow: (appId: string) => void;
  restoreWindow: (appId: string) => void;
  toggleMaximize: (appId: string) => void;
  getWindow: (appId: string) => WindowState | undefined;
  isWindowOpen: (appId: string) => boolean;
  getFocusedAppId: () => string | null;
  restoreDesktopDefault: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null
);

interface WindowManagerProviderProps {
  children: React.ReactNode;
  initialAppId?: string; // If provided, this app will be opened and focused on load
}

export function WindowManagerProvider({
  children,
  initialAppId,
}: WindowManagerProviderProps) {
  /**
   * Compute initial state based on:
   * 1. Whether user has saved state (localStorage)
   * 2. Which app they're navigating to (initialAppId)
   *
   * Logic:
   * - New visitor + specific app URL → that app fullscreen
   * - New visitor + no specific app → default app (notes) fullscreen
   * - Returning visitor + specific app URL → saved state with that app focused
   * - Returning visitor + no specific app → saved state as-is
   */
  const computeInitialState = React.useCallback((): WindowManagerState => {
    const savedState = loadStateFromStorage();
    const targetApp = initialAppId || DEFAULT_APP;

    if (savedState) {
      // Returning visitor: use saved state, focus requested app
      return initialAppId ? withFocusedApp(savedState, initialAppId) : savedState;
    } else {
      // New visitor: show target app fullscreen
      return getNewVisitorState(targetApp);
    }
  }, [initialAppId]);

  const [state, dispatch] = useReducer(windowReducer, null, computeInitialState);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (isHydrated) {
      saveStateToStorage(state);
    }
  }, [state, isHydrated]);

  const openWindow = useCallback((appId: string) => {
    dispatch({ type: "OPEN_WINDOW", appId });
  }, []);

  const closeWindow = useCallback((appId: string) => {
    dispatch({ type: "CLOSE_WINDOW", appId });
  }, []);

  const focusWindow = useCallback((appId: string) => {
    dispatch({ type: "FOCUS_WINDOW", appId });
  }, []);

  const moveWindow = useCallback((appId: string, position: Position) => {
    dispatch({ type: "MOVE_WINDOW", appId, position });
  }, []);

  const resizeWindow = useCallback((appId: string, size: Size, position?: Position) => {
    dispatch({ type: "RESIZE_WINDOW", appId, size, position });
  }, []);

  const minimizeWindow = useCallback((appId: string) => {
    dispatch({ type: "MINIMIZE_WINDOW", appId });
  }, []);

  const maximizeWindow = useCallback((appId: string) => {
    dispatch({ type: "MAXIMIZE_WINDOW", appId });
  }, []);

  const restoreWindow = useCallback((appId: string) => {
    dispatch({ type: "RESTORE_WINDOW", appId });
  }, []);

  const toggleMaximize = useCallback(
    (appId: string) => {
      const window = state.windows[appId];
      if (window?.isMaximized) {
        dispatch({ type: "RESTORE_WINDOW", appId });
      } else {
        dispatch({ type: "MAXIMIZE_WINDOW", appId });
      }
    },
    [state.windows]
  );

  const getWindow = useCallback(
    (appId: string) => state.windows[appId],
    [state.windows]
  );

  const isWindowOpen = useCallback(
    (appId: string) => state.windows[appId]?.isOpen ?? false,
    [state.windows]
  );

  const getFocusedAppId = useCallback(
    () => state.focusedWindowId,
    [state.focusedWindowId]
  );

  const restoreDesktopDefault = useCallback(() => {
    dispatch({ type: "RESTORE_STATE", state: getDesktopDefaultState() });
  }, []);

  const value: WindowManagerContextValue = {
    state,
    openWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    toggleMaximize,
    getWindow,
    isWindowOpen,
    getFocusedAppId,
    restoreDesktopDefault,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager(): WindowManagerContextValue {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error(
      "useWindowManager must be used within a WindowManagerProvider"
    );
  }
  return context;
}
