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

function parsePayload<T>(
  serializedState: string,
  deserialize: (serializedState: string) => T | null
): T | null {
  try {
    return deserialize(serializedState);
  } catch {
    return null;
  }
}

export function loadWindowState<T>(
  tabStorage: StorageArea,
  durableStorage: StorageArea,
  deserialize: (serializedState: string) => T | null
): T | null {
  try {
    const tabValue = tabStorage.getItem(WINDOW_STATE_STORAGE_KEY);
    if (tabValue !== null) {
      const parsedTabValue = parsePayload(tabValue, deserialize);
      if (parsedTabValue !== null) {
        // Only remove the legacy copy after the preferred value is valid.
        try {
          durableStorage.removeItem(WINDOW_STATE_STORAGE_KEY);
        } catch {
          // Storage can be unavailable in restricted browser contexts.
        }
        return parsedTabValue;
      }

      try {
        tabStorage.removeItem(WINDOW_STATE_STORAGE_KEY);
      } catch {
        // Continue to the valid legacy fallback when cleanup is unavailable.
      }
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

  const parsedLegacyValue = parsePayload(legacyValue, deserialize);
  if (parsedLegacyValue === null) return null;

  try {
    tabStorage.setItem(WINDOW_STATE_STORAGE_KEY, legacyValue);
  } catch {
    // Keep the legacy value when migration cannot be completed.
    return parsedLegacyValue;
  }

  try {
    durableStorage.removeItem(WINDOW_STATE_STORAGE_KEY);
  } catch {
    // The successful tab write is enough; cleanup can be retried next load.
  }

  return parsedLegacyValue;
}

export function saveWindowStatePayload(
  tabStorage: StorageArea,
  serializedState: string
): void {
  tabStorage.setItem(WINDOW_STATE_STORAGE_KEY, serializedState);
}
