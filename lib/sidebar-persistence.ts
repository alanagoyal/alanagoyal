/**
 * Sidebar/View Persistence Utility
 *
 * Persists sidebar and view state across page refreshes using sessionStorage.
 * State resets when the browser window is closed (matches macOS behavior).
 *
 * ## Design Patterns
 *
 * 1. **Simple enum-like values** (e.g., Finder sidebar):
 *    Use `createSidebarPersistence()` factory with validation.
 *
 * 2. **Dynamic values** (e.g., Photos with collection IDs):
 *    Use simple load/save functions that accept any string.
 *
 * 3. **Compound state** (e.g., Settings with category + panel):
 *    Use JSON serialization with validation on load.
 *
 * ## Adding Persistence to a New App
 *
 * 1. Add a storage key constant below
 * 2. Create load/save functions following existing patterns
 * 3. In your component:
 *    - Initialize state with loader: `useState(() => loadMyAppState())`
 *    - Save on change: `useEffect(() => { saveMyAppState(state) }, [state])`
 *    - Guard saves until after first render to avoid overwriting with defaults
 */

// ============================================================================
// Storage Keys (centralized to avoid conflicts)
// ============================================================================

const STORAGE_KEYS = {
  // Session storage (resets on window close)
  FINDER_SIDEBAR: "finder-sidebar",
  PHOTOS_VIEW: "photos-view",
  PHOTOS_SELECTED: "photos-selected-id",
  SETTINGS_STATE: "settings-state",
  CALENDAR_VIEW: "calendar-view",
  CALENDAR_DATE: "calendar-date",
  CALENDAR_SCROLL: "calendar-scroll",
  MUSIC_STATE: "music-state",
} as const;

// ============================================================================
// Generic Factory (for simple enum-like sidebar values)
// ============================================================================

interface SidebarPersistence<T extends string> {
  load: () => T;
  save: (value: T) => void;
  clear: () => void;
}

/**
 * Creates a type-safe persistence manager for sidebar state.
 * Use this when sidebar items are a fixed set of known values.
 *
 * @param key - sessionStorage key
 * @param defaultValue - fallback when no saved state exists
 * @param validValues - array of valid values for validation
 */
export function createSidebarPersistence<T extends string>(
  key: string,
  defaultValue: T,
  validValues: readonly T[]
): SidebarPersistence<T> {
  const isValid = (value: string | null): value is T => {
    return value !== null && validValues.includes(value as T);
  };

  return {
    load: (): T => {
      if (typeof window === "undefined") return defaultValue;
      try {
        const saved = sessionStorage.getItem(key);
        return isValid(saved) ? saved : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    save: (value: T): void => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // Ignore storage errors (e.g., quota exceeded, private browsing)
      }
    },

    clear: (): void => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    },
  };
}

// ============================================================================
// Finder Persistence
// ============================================================================

// Note: SidebarItem type is defined in finder-app.tsx as the source of truth.
// This array must match that type.
const FINDER_SIDEBAR_ITEMS = [
  "recents",
  "applications",
  "desktop",
  "documents",
  "downloads",
  "projects",
  "trash",
] as const;

type FinderSidebarItem = (typeof FINDER_SIDEBAR_ITEMS)[number];

export const finderSidebarPersistence = createSidebarPersistence<FinderSidebarItem>(
  STORAGE_KEYS.FINDER_SIDEBAR,
  "recents",
  FINDER_SIDEBAR_ITEMS
);

export function clearFinderState(): void {
  finderSidebarPersistence.clear();
}

// ============================================================================
// Photos Persistence
// ============================================================================

// Photos accepts dynamic collection IDs, so we can't use the factory.
// Any non-empty string is valid (library, favorites, or collection IDs).

export function loadPhotosView(): string {
  if (typeof window === "undefined") return "library";
  try {
    return sessionStorage.getItem(STORAGE_KEYS.PHOTOS_VIEW) || "library";
  } catch {
    return "library";
  }
}

export function savePhotosView(view: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.PHOTOS_VIEW, view);
  } catch {
    // Ignore storage errors
  }
}

export function loadPhotosSelectedId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.PHOTOS_SELECTED);
  } catch {
    return null;
  }
}

export function savePhotosSelectedId(photoId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (photoId) {
      sessionStorage.setItem(STORAGE_KEYS.PHOTOS_SELECTED, photoId);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.PHOTOS_SELECTED);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearPhotosState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.PHOTOS_VIEW);
    sessionStorage.removeItem(STORAGE_KEYS.PHOTOS_SELECTED);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Settings Persistence
// ============================================================================

// Note: SettingsCategory and SettingsPanel types are defined in settings-app.tsx.
// These arrays must match those types.
const SETTINGS_CATEGORIES = ["general", "appearance", "wifi", "bluetooth"] as const;
const SETTINGS_PANELS = ["about", "personal-info", "storage"] as const;

type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number];
type SettingsPanel = (typeof SETTINGS_PANELS)[number] | null;

interface SettingsState {
  category: SettingsCategory;
  panel: SettingsPanel;
}

export function loadSettingsState(): SettingsState {
  const defaultState: SettingsState = { category: "general", panel: null };

  if (typeof window === "undefined") return defaultState;

  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SETTINGS_STATE);
    if (!saved) return defaultState;

    const parsed = JSON.parse(saved);

    // Validate category
    const category: SettingsCategory = SETTINGS_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : "general";

    // Validate panel (null is valid)
    const panel: SettingsPanel =
      parsed.panel === null || SETTINGS_PANELS.includes(parsed.panel)
        ? parsed.panel
        : null;

    return { category, panel };
  } catch {
    return defaultState;
  }
}

export function saveSettingsState(
  category: SettingsCategory,
  panel: SettingsPanel
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEYS.SETTINGS_STATE,
      JSON.stringify({ category, panel })
    );
  } catch {
    // Ignore storage errors
  }
}

export function clearSettingsState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SETTINGS_STATE);
    // Note: WiFi/Bluetooth toggles are managed by SystemSettingsContext and persist until user changes them
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// App Close Handler
// Called when an app window is closed (not minimized) to reset sidebar state
// ============================================================================

export function clearCalendarState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CALENDAR_VIEW);
    sessionStorage.removeItem(STORAGE_KEYS.CALENDAR_DATE);
    sessionStorage.removeItem(STORAGE_KEYS.CALENDAR_SCROLL);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Music Persistence
// ============================================================================

import type { MusicView } from "@/components/apps/music/types";

// Valid views for validation - must match MusicView type
const MUSIC_VIEWS: readonly MusicView[] = [
  "home",
  "browse",
  "artists",
  "albums",
  "songs",
  "playlist",
];

interface MusicState {
  view: MusicView;
  playlistId: string | null;
}

export function loadMusicState(): MusicState {
  const defaultState: MusicState = { view: "home", playlistId: null };

  if (typeof window === "undefined") return defaultState;

  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.MUSIC_STATE);
    if (!saved) return defaultState;

    const parsed = JSON.parse(saved);

    // Validate view
    const view: MusicView = MUSIC_VIEWS.includes(parsed.view)
      ? parsed.view
      : "home";

    // playlistId can be any string or null
    const playlistId: string | null =
      typeof parsed.playlistId === "string" ? parsed.playlistId : null;

    return { view, playlistId };
  } catch {
    return defaultState;
  }
}

export function saveMusicState(view: MusicView, playlistId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEYS.MUSIC_STATE,
      JSON.stringify({ view, playlistId })
    );
  } catch {
    // Ignore storage errors
  }
}

export function clearMusicState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.MUSIC_STATE);
  } catch {
    // Ignore storage errors
  }
}

export function clearAppState(appId: string): void {
  switch (appId) {
    case "finder":
      clearFinderState();
      break;
    case "photos":
      clearPhotosState();
      break;
    case "settings":
      clearSettingsState();
      break;
    case "calendar":
      clearCalendarState();
      break;
    case "music":
      clearMusicState();
      break;
  }
}
