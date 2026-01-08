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

function getInitialState(): WindowManagerState {
  const windows: Record<string, WindowState> = {};
  APPS.forEach((app) => {
    windows[app.id] = getDefaultWindowState(app.id);
  });
  // Notes opens by default in fullscreen (for new visitors)
  windows["notes"].isOpen = true;
  windows["notes"].isMaximized = true;
  windows["notes"].zIndex = 1;

  return {
    windows,
    focusedWindowId: "notes",
    nextZIndex: 2,
  };
}

// Desktop default: Notes and Messages both open in windowed mode
function getDesktopDefaultState(): WindowManagerState {
  const windows: Record<string, WindowState> = {};
  APPS.forEach((app) => {
    windows[app.id] = getDefaultWindowState(app.id);
  });
  // Notes open in windowed mode
  windows["notes"].isOpen = true;
  windows["notes"].isMaximized = false;
  windows["notes"].zIndex = 1;

  // Messages open in windowed mode
  windows["messages"].isOpen = true;
  windows["messages"].isMaximized = false;
  windows["messages"].zIndex = 2;

  return {
    windows,
    focusedWindowId: "messages",
    nextZIndex: 3,
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

// Max z-index before we normalize (keep well below menu bar's z-index)
const MAX_Z_INDEX = 500;

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
  // Initialize state synchronously based on initialAppId to avoid flash
  const getInitialStateWithApp = React.useCallback(() => {
    if (initialAppId) {
      const savedState = loadStateFromStorage();
      if (savedState) {
        return {
          ...savedState,
          windows: {
            ...savedState.windows,
            [initialAppId]: {
              ...savedState.windows[initialAppId],
              isOpen: true,
              isMinimized: false,
              zIndex: savedState.nextZIndex,
            },
          },
          focusedWindowId: initialAppId,
          nextZIndex: savedState.nextZIndex + 1,
        };
      } else {
        const initialState = getInitialState();
        return {
          ...initialState,
          windows: {
            ...initialState.windows,
            [initialAppId]: {
              ...initialState.windows[initialAppId],
              isOpen: true,
              zIndex: initialState.nextZIndex,
            },
          },
          focusedWindowId: initialAppId,
          nextZIndex: initialState.nextZIndex + 1,
        };
      }
    } else {
      const savedState = loadStateFromStorage();
      return savedState || getInitialState();
    }
  }, [initialAppId]);

  const [state, dispatch] = useReducer(windowReducer, null, getInitialStateWithApp);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Handle initialAppId changes after mount
  useEffect(() => {
    if (initialAppId) {
      const savedState = loadStateFromStorage();
      if (savedState) {
        const newState: WindowManagerState = {
          ...savedState,
          windows: {
            ...savedState.windows,
            [initialAppId]: {
              ...savedState.windows[initialAppId],
              isOpen: true,
              isMinimized: false,
              zIndex: savedState.nextZIndex,
            },
          },
          focusedWindowId: initialAppId,
          nextZIndex: savedState.nextZIndex + 1,
        };
        dispatch({ type: "RESTORE_STATE", state: newState });
      }
    }
    setIsHydrated(true);
  }, [initialAppId]);

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
