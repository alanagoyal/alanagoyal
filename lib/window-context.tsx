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
import { clearAppState } from "./sidebar-persistence";

const STORAGE_KEY = "desktop-window-state";

// =============================================================================
// Multi-Window Helpers
// =============================================================================

/**
 * Generate a window ID for multi-window apps
 * Format: "appId-instanceNumber" (e.g., "textedit-0", "textedit-1")
 */
function generateWindowId(appId: string, instanceNumber: number): string {
  return `${appId}-${instanceNumber}`;
}

/**
 * Parse a window ID to get the base app ID
 * "textedit-0" → "textedit", "notes" → "notes"
 */
function getAppIdFromWindowId(windowId: string): string {
  const multiWindowApp = APPS.find(
    (a) => a.multiWindow && windowId.startsWith(`${a.id}-`)
  );
  return multiWindowApp ? multiWindowApp.id : windowId;
}

/**
 * Check if an app supports multiple windows
 */
function isMultiWindowApp(appId: string): boolean {
  return getAppById(appId)?.multiWindow ?? false;
}

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
    { appId: "messages", position: { x: 500, y: 60 } },
    { appId: "notes", position: { x: 150, y: 40 }, size: { width: 1000, height: 700 } },
  ],
  focusedAppId: "notes",
} as const;

// Export for use in desktop.tsx URL handling
export const DESKTOP_DEFAULT_FOCUSED_APP = DESKTOP_DEFAULT_CONFIG.focusedAppId;

// Export helper for parsing multi-window IDs
export { getAppIdFromWindowId };

/**
 * Creates a fresh state with all windows closed
 * Multi-window apps start with no windows (they're created on demand)
 */
function getBaseState(): WindowManagerState {
  const windows: Record<string, WindowState> = {};
  APPS.forEach((app) => {
    // Multi-window apps don't get default windows - they're created on demand
    if (!app.multiWindow) {
      windows[app.id] = getDefaultWindowState(app.id);
    }
  });
  return {
    windows,
    focusedWindowId: null,
    nextZIndex: 1,
    nextInstanceNumber: {},
  };
}

/**
 * Desktop default state: multiple apps open in windowed mode
 * Used after logout/restart/shutdown to show a "fresh desktop" view
 * Notes in front (left of center), Messages behind (right, peeking out)
 */
function getDesktopDefaultState(): WindowManagerState {
  const state = getBaseState();
  const { windows, focusedAppId } = DESKTOP_DEFAULT_CONFIG;

  windows.forEach((config, index) => {
    state.windows[config.appId].isOpen = true;
    state.windows[config.appId].isMaximized = false;
    state.windows[config.appId].zIndex = index + 1;
    state.windows[config.appId].position = config.position;
    if ('size' in config && config.size) {
      state.windows[config.appId].size = config.size;
    }
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
  // For multi-window apps, we can't pre-focus without an instanceId
  if (isMultiWindowApp(appId)) {
    return savedState;
  }

  // Un-maximize any other maximized windows so the focused app is visible
  // (maximized windows use MAXIMIZED_Z_INDEX which would cover the focused app)
  const windowUpdates: Record<string, WindowState> = {};
  for (const [windowId, windowState] of Object.entries(savedState.windows)) {
    if (windowId !== appId && windowState.isMaximized) {
      windowUpdates[windowId] = { ...windowState, isMaximized: false };
    }
  }
  const updatedWindows = { ...savedState.windows, ...windowUpdates };

  return {
    ...savedState,
    windows: {
      ...updatedWindows,
      [appId]: {
        ...updatedWindows[appId],
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
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (parsed.windows && typeof parsed.nextZIndex === "number") {
        // Merge with current APPS config to pick up any new single-window apps
        const mergedWindows: Record<string, WindowState> = { ...parsed.windows };
        APPS.forEach((app) => {
          // Only add default windows for single-window apps
          if (!app.multiWindow && !mergedWindows[app.id]) {
            mergedWindows[app.id] = getDefaultWindowState(app.id);
          }
        });
        return {
          ...parsed,
          windows: mergedWindows,
          // Ensure nextInstanceNumber exists (migration from old state)
          nextInstanceNumber: parsed.nextInstanceNumber || {},
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save window state:", e);
  }
}

/**
 * Get the topmost (highest z-index) open window for a specific app
 * Used by MobileShell to display the correct window when switching from desktop
 * Reads directly from sessionStorage to work outside WindowManagerProvider
 */
export function getTopmostWindowForApp(appId: string): WindowState | null {
  const savedState = loadStateFromStorage();
  if (!savedState) return null;

  const appWindows = Object.values(savedState.windows)
    .filter((w) => {
      // Only match windows where appId explicitly matches
      // This prevents returning windows from different apps that might have similar instanceIds
      return w.appId === appId && w.isOpen && !w.isMinimized;
    })
    .sort((a, b) => b.zIndex - a.zIndex);

  return appWindows[0] || null;
}

// Max z-index before we normalize (windows stay in 1-50 range)
// See lib/desktop/z-index.ts for the full layering system
const MAX_Z_INDEX = 50;

// Z-index for maximized/fullscreen windows - always above normal windows
// Export so Window components can use consistently
export const MAXIMIZED_Z_INDEX = 80;

// Normalize z-indexes to prevent unbounded growth
function normalizeZIndexes(state: WindowManagerState): WindowManagerState {
  if (state.nextZIndex <= MAX_Z_INDEX) return state;

  // Sort windows by current z-index to preserve order
  const sortedWindows = Object.values(state.windows).sort((a, b) => a.zIndex - b.zIndex);

  // Reassign z-indexes starting from 1
  const newWindows: Record<string, WindowState> = {};
  sortedWindows.forEach((win, index) => {
    // Use win.id as key (handles both single-window "notes" and multi-window "textedit-0")
    newWindows[win.id] = { ...win, zIndex: index + 1 };
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

    case "UNMINIMIZE_WINDOW": {
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
            // Preserve isMaximized so fullscreen windows restore to fullscreen
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

    case "INCREMENT_Z_INDEX": {
      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    // ==========================================================================
    // Multi-Window Actions
    // ==========================================================================

    case "OPEN_MULTI_WINDOW": {
      const { appId, instanceId, metadata, size: customSize } = action;
      const app = getAppById(appId);
      if (!app?.multiWindow) return state;

      // Check if a window with this instanceId already exists
      const existingWindow = Object.values(state.windows).find(
        (w) => w.appId === appId && w.instanceId === instanceId
      );
      if (existingWindow) {
        // Focus existing window instead of creating new
        return windowReducer(state, {
          type: "FOCUS_MULTI_WINDOW",
          windowId: existingWindow.id,
        });
      }

      // Calculate cascaded position based on existing open windows of this app
      const existingAppWindows = Object.values(state.windows).filter(
        (w) => w.appId === appId && w.isOpen
      );
      const cascadeOffset = app.cascadeOffset ?? 30;
      const basePosition = app.defaultPosition;
      const newPosition = {
        x: basePosition.x + existingAppWindows.length * cascadeOffset,
        y: basePosition.y + existingAppWindows.length * cascadeOffset,
      };

      // Get next instance number for this app
      const instanceNumber = state.nextInstanceNumber[appId] ?? 0;
      const windowId = generateWindowId(appId, instanceNumber);

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            id: windowId,
            appId,
            instanceId,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: newPosition,
            size: customSize ?? app.defaultSize,
            zIndex: state.nextZIndex,
            metadata,
          },
        },
        focusedWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
        nextInstanceNumber: {
          ...state.nextInstanceNumber,
          [appId]: instanceNumber + 1,
        },
      };
    }

    case "CLOSE_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      // Remove the window
      const newWindows = { ...state.windows };
      delete newWindows[windowId];

      // Find next window to focus (highest z-index among open, non-minimized)
      const openWindows = Object.values(newWindows)
        .filter((w) => w.isOpen && !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex);
      const nextFocused = openWindows[0]?.id || null;

      return {
        ...state,
        windows: newWindows,
        focusedWindowId: nextFocused,
      };
    }

    case "FOCUS_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window || !window.isOpen) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            isMinimized: false,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "MOVE_MULTI_WINDOW": {
      const { windowId, position } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            position,
          },
        },
      };
    }

    case "RESIZE_MULTI_WINDOW": {
      const { windowId, size, position } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            size,
            ...(position && { position }),
          },
        },
      };
    }

    case "MINIMIZE_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window || !window.isOpen) return state;

      // Find next window to focus (non-minimized)
      const openWindows = Object.values(state.windows)
        .filter((w) => w.isOpen && !w.isMinimized && w.id !== windowId)
        .sort((a, b) => b.zIndex - a.zIndex);
      const nextFocused = openWindows[0]?.id || null;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            isMinimized: true,
          },
        },
        focusedWindowId: nextFocused,
      };
    }

    case "MAXIMIZE_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            isMaximized: true,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "RESTORE_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            isMinimized: false,
            isMaximized: false,
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "UNMINIMIZE_MULTI_WINDOW": {
      const { windowId } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            isMinimized: false,
            // Preserve isMaximized so fullscreen windows restore to fullscreen
            zIndex: state.nextZIndex,
          },
        },
        focusedWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "BRING_APP_TO_FRONT": {
      const { appId } = action;
      // Get all open windows for this app, sorted by current z-index (ascending)
      const appWindows = Object.values(state.windows)
        .filter((w) => w.appId === appId && w.isOpen)
        .sort((a, b) => a.zIndex - b.zIndex);

      if (appWindows.length === 0) return state;

      // Assign new z-indexes preserving relative order, un-minimize all
      let nextZ = state.nextZIndex;
      const newWindows = { ...state.windows };
      appWindows.forEach((w) => {
        newWindows[w.id] = { ...w, zIndex: nextZ++, isMinimized: false };
      });

      // Focus the topmost window (last in sorted array)
      const topWindow = appWindows[appWindows.length - 1];

      return {
        ...state,
        windows: newWindows,
        focusedWindowId: topWindow.id,
        nextZIndex: nextZ,
      };
    }

    case "UPDATE_WINDOW_METADATA": {
      const { windowId, metadata } = action;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            metadata: { ...window.metadata, ...metadata },
          },
        },
      };
    }

    default:
      return state;
  }
}

interface WindowManagerContextValue {
  state: WindowManagerState;
  // Single-window app methods
  openWindow: (appId: string) => void;
  closeWindow: (appId: string) => void;
  focusWindow: (appId: string) => void;
  moveWindow: (appId: string, position: Position) => void;
  resizeWindow: (appId: string, size: Size, position?: Position) => void;
  minimizeWindow: (appId: string) => void;
  maximizeWindow: (appId: string) => void;
  restoreWindow: (appId: string) => void;
  unminimizeWindow: (appId: string) => void;
  toggleMaximize: (appId: string) => void;
  getWindow: (appId: string) => WindowState | undefined;
  isWindowOpen: (appId: string) => boolean;
  // Multi-window app methods
  openMultiWindow: (appId: string, instanceId: string, metadata?: Record<string, unknown>, size?: Size) => void;
  closeMultiWindow: (windowId: string) => void;
  focusMultiWindow: (windowId: string) => void;
  moveMultiWindow: (windowId: string, position: Position) => void;
  resizeMultiWindow: (windowId: string, size: Size, position?: Position) => void;
  minimizeMultiWindow: (windowId: string) => void;
  maximizeMultiWindow: (windowId: string) => void;
  restoreMultiWindow: (windowId: string) => void;
  unminimizeMultiWindow: (windowId: string) => void;
  toggleMaximizeMultiWindow: (windowId: string) => void;
  bringAppToFront: (appId: string) => void;
  updateWindowMetadata: (windowId: string, metadata: Record<string, unknown>) => void;
  // Query helpers
  getWindowsByApp: (appId: string) => WindowState[];
  hasOpenWindows: (appId: string) => boolean;
  getFocusedAppId: () => string | null;
  // State management
  restoreDesktopDefault: () => void;
  claimZIndex: () => number;
  // Menu bar state (prevents window focus when menu is open)
  // Uses a ref for synchronous checks in event handlers
  isMenuOpenRef: React.MutableRefObject<boolean>;
  setMenuOpen: (isOpen: boolean) => void;
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
   * 1. Whether user has saved state (sessionStorage)
   * 2. Which app they're navigating to (initialAppId)
   *
   * Logic:
   * - Returning visitor + specific app URL → saved state with that app focused
   * - Returning visitor + no specific app → saved state as-is
   * - New visitor + specific app URL → desktop default with that app focused
   * - New visitor + no specific app → desktop default as-is
   */
  const computeInitialState = React.useCallback((): WindowManagerState => {
    const savedState = loadStateFromStorage();

    if (savedState) {
      // Returning visitor: preserve their session state as-is unless a deep link requests focus
      if (initialAppId) {
        const focusedAppId = savedState.focusedWindowId
          ? getAppIdFromWindowId(savedState.focusedWindowId)
          : null;

        if (focusedAppId !== initialAppId) {
          if (isMultiWindowApp(initialAppId)) {
            const appWindows = Object.values(savedState.windows)
              .filter((w) => w.appId === initialAppId && w.isOpen)
              .sort((a, b) => b.zIndex - a.zIndex);
            const topmost = appWindows[0];
            if (topmost) {
              return {
                ...savedState,
                windows: {
                  ...savedState.windows,
                  [topmost.id]: {
                    ...topmost,
                    isMinimized: false,
                    zIndex: savedState.nextZIndex,
                  },
                },
                focusedWindowId: topmost.id,
                nextZIndex: savedState.nextZIndex + 1,
              };
            }
          } else {
            return withFocusedApp(savedState, initialAppId);
          }
        }
      }
      return savedState;
    } else {
      // New visitor: show desktop default layout, focus requested app if specified
      const defaultState = getDesktopDefaultState();
      return initialAppId ? withFocusedApp(defaultState, initialAppId) : defaultState;
    }
  }, [initialAppId]);

  const [state, dispatch] = useReducer(windowReducer, null, computeInitialState);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Ref for menu open state - allows synchronous checks in event handlers
  const isMenuOpenRef = React.useRef(false);
  const setMenuOpen = useCallback((isOpen: boolean) => {
    isMenuOpenRef.current = isOpen;
  }, []);

  // Ref to track z-index synchronously for external callers
  const zIndexRef = React.useRef(state.nextZIndex);

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Keep z-index ref in sync with state
  useEffect(() => {
    zIndexRef.current = state.nextZIndex;
  }, [state.nextZIndex]);

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
    // Clear sidebar/view state when app window is closed
    clearAppState(appId);
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

  const unminimizeWindow = useCallback((appId: string) => {
    dispatch({ type: "UNMINIMIZE_WINDOW", appId });
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

  // Returns the base app ID (parses multi-window IDs like "textedit-0" -> "textedit")
  const getFocusedAppId = useCallback(() => {
    if (!state.focusedWindowId) return null;
    return getAppIdFromWindowId(state.focusedWindowId);
  }, [state.focusedWindowId]);

  const restoreDesktopDefault = useCallback(() => {
    dispatch({ type: "RESTORE_STATE", state: getDesktopDefaultState() });
  }, []);

  // Claim a z-index for external windows
  const claimZIndex = useCallback(() => {
    const zIndex = zIndexRef.current;
    zIndexRef.current += 1;
    dispatch({ type: "INCREMENT_Z_INDEX" });
    return zIndex;
  }, []);

  // ==========================================================================
  // Multi-Window Methods
  // ==========================================================================

  const openMultiWindow = useCallback(
    (appId: string, instanceId: string, metadata?: Record<string, unknown>, size?: Size) => {
      dispatch({ type: "OPEN_MULTI_WINDOW", appId, instanceId, metadata, size });
    },
    []
  );

  const closeMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "CLOSE_MULTI_WINDOW", windowId });
  }, []);

  const focusMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "FOCUS_MULTI_WINDOW", windowId });
  }, []);

  const moveMultiWindow = useCallback((windowId: string, position: Position) => {
    dispatch({ type: "MOVE_MULTI_WINDOW", windowId, position });
  }, []);

  const resizeMultiWindow = useCallback(
    (windowId: string, size: Size, position?: Position) => {
      dispatch({ type: "RESIZE_MULTI_WINDOW", windowId, size, position });
    },
    []
  );

  const minimizeMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "MINIMIZE_MULTI_WINDOW", windowId });
  }, []);

  const maximizeMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "MAXIMIZE_MULTI_WINDOW", windowId });
  }, []);

  const restoreMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "RESTORE_MULTI_WINDOW", windowId });
  }, []);

  const unminimizeMultiWindow = useCallback((windowId: string) => {
    dispatch({ type: "UNMINIMIZE_MULTI_WINDOW", windowId });
  }, []);

  const toggleMaximizeMultiWindow = useCallback(
    (windowId: string) => {
      const window = state.windows[windowId];
      if (window?.isMaximized) {
        dispatch({ type: "RESTORE_MULTI_WINDOW", windowId });
      } else {
        dispatch({ type: "MAXIMIZE_MULTI_WINDOW", windowId });
      }
    },
    [state.windows]
  );

  const bringAppToFront = useCallback((appId: string) => {
    dispatch({ type: "BRING_APP_TO_FRONT", appId });
  }, []);

  const updateWindowMetadata = useCallback(
    (windowId: string, metadata: Record<string, unknown>) => {
      dispatch({ type: "UPDATE_WINDOW_METADATA", windowId, metadata });
    },
    []
  );

  // Get all windows for a specific app (for multi-window apps)
  const getWindowsByApp = useCallback(
    (appId: string) =>
      Object.values(state.windows).filter((w) => w.appId === appId),
    [state.windows]
  );

  // Check if an app has any open windows (works for both single and multi-window)
  const hasOpenWindows = useCallback(
    (appId: string) => {
      const app = getAppById(appId);
      if (app?.multiWindow) {
        // For multi-window apps, check if any window with this appId is open
        return Object.values(state.windows).some(
          (w) => w.appId === appId && w.isOpen
        );
      } else {
        // For single-window apps, use existing logic
        return state.windows[appId]?.isOpen ?? false;
      }
    },
    [state.windows]
  );

  const value: WindowManagerContextValue = {
    state,
    // Single-window methods
    openWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    unminimizeWindow,
    toggleMaximize,
    getWindow,
    isWindowOpen,
    // Multi-window methods
    openMultiWindow,
    closeMultiWindow,
    focusMultiWindow,
    moveMultiWindow,
    resizeMultiWindow,
    minimizeMultiWindow,
    maximizeMultiWindow,
    restoreMultiWindow,
    unminimizeMultiWindow,
    toggleMaximizeMultiWindow,
    bringAppToFront,
    updateWindowMetadata,
    // Query helpers
    getWindowsByApp,
    hasOpenWindows,
    getFocusedAppId,
    // State management
    restoreDesktopDefault,
    claimZIndex,
    // Menu bar state
    isMenuOpenRef,
    setMenuOpen,
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
