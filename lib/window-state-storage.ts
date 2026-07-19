/**
 * Browser storage boundary for desktop window state.
 *
 * Window state is tab-scoped runtime state: a refresh should restore the
 * current desktop, while a new tab or browser session should start with its
 * own desktop. A legacy localStorage value is migrated once so existing users
 * do not lose their current layout when this policy changes.
 */

export const WINDOW_STATE_STORAGE_KEY = "desktop-window-state";

type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadWindowStatePayload(
  tabStorage: StorageArea,
  durableStorage: StorageArea
): string | null {
  try {
    const tabValue = tabStorage.getItem(WINDOW_STATE_STORAGE_KEY);
    if (tabValue !== null) {
      // Best-effort cleanup for users who already have the tab-scoped value.
      try {
        durableStorage.removeItem(WINDOW_STATE_STORAGE_KEY);
      } catch {
        // Storage can be unavailable in restricted browser contexts.
      }
      return tabValue;
    }
  } catch {
    // Fall back to the legacy durable value below.
  }

  let legacyValue: string | null;
  try {
    legacyValue = durableStorage.getItem(WINDOW_STATE_STORAGE_KEY);
  } catch {
    return null;
  }

  if (legacyValue === null) return null;

  try {
    tabStorage.setItem(WINDOW_STATE_STORAGE_KEY, legacyValue);
  } catch {
    // Keep the legacy value when migration cannot be completed.
    return legacyValue;
  }

  try {
    durableStorage.removeItem(WINDOW_STATE_STORAGE_KEY);
  } catch {
    // The successful tab write is enough; cleanup can be retried next load.
  }

  return legacyValue;
}

export function saveWindowStatePayload(
  tabStorage: StorageArea,
  serializedState: string
): void {
  tabStorage.setItem(WINDOW_STATE_STORAGE_KEY, serializedState);
}
