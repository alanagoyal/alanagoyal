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
  // Notes opens by default
  windows["notes"].isOpen = true;
  windows["notes"].zIndex = 1;

  return {
    windows,
    focusedWindowId: "notes",
    nextZIndex: 2,
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
        return parsed;
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

function windowReducer(
  state: WindowManagerState,
  action: WindowAction
): WindowManagerState {
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
  const [state, dispatch] = useReducer(windowReducer, getInitialState());
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Load from localStorage on mount, but override with initialAppId if provided
  useEffect(() => {
    if (initialAppId) {
      // When URL specifies an app, load localStorage for positions but ensure this app is open
      const savedState = loadStateFromStorage();
      if (savedState) {
        // Start with saved state but ensure the specified app is open and focused
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
      } else {
        // No saved state, create initial with specified app open
        const initialState = getInitialState();
        const newState: WindowManagerState = {
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
        dispatch({ type: "RESTORE_STATE", state: newState });
      }
    } else {
      // No initialAppId - use localStorage or defaults
      const savedState = loadStateFromStorage();
      if (savedState) {
        dispatch({ type: "RESTORE_STATE", state: savedState });
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
