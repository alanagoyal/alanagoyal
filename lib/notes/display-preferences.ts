import type {
  NotesGroupMode,
  NotesSortDirection,
  NotesSortField,
  NotesViewMode,
} from "./types";

export const NOTES_DISPLAY_STORAGE_KEYS = {
  viewMode: "notes-view-mode",
  groupMode: "notes-group-mode",
  legacyGroupByDate: "notes-group-by-date",
  sortField: "notes-sort-field",
  sortDirection: "notes-sort-direction",
} as const;

export interface NotesDisplayPreferences {
  viewMode: NotesViewMode;
  groupMode: NotesGroupMode;
  sortField: NotesSortField;
  sortDirection: NotesSortDirection;
}

export const DEFAULT_NOTES_DISPLAY_PREFERENCES: NotesDisplayPreferences = {
  viewMode: "list",
  groupMode: "edited",
  sortField: "default",
  sortDirection: "newest",
};

type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isViewMode = (value: string | null): value is NotesViewMode =>
  value === "list" || value === "gallery";

const isGroupMode = (value: string | null): value is NotesGroupMode =>
  value === "edited" || value === "created" || value === "off";

const isSortField = (value: string | null): value is NotesSortField =>
  value === "default" ||
  value === "edited" ||
  value === "created" ||
  value === "title";

const isSortDirection = (
  value: string | null,
): value is NotesSortDirection => value === "newest" || value === "oldest";

export function clearNotesDisplayPreferences(storage: StorageArea): void {
  try {
    Object.values(NOTES_DISPLAY_STORAGE_KEYS).forEach((key) => {
      storage.removeItem(key);
    });
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function loadNotesDisplayPreferences(
  tabStorage: StorageArea,
  legacyDurableStorage?: StorageArea,
): NotesDisplayPreferences {
  if (legacyDurableStorage) {
    clearNotesDisplayPreferences(legacyDurableStorage);
  }

  try {
    const viewMode = tabStorage.getItem(NOTES_DISPLAY_STORAGE_KEYS.viewMode);
    const groupMode = tabStorage.getItem(NOTES_DISPLAY_STORAGE_KEYS.groupMode);
    const legacyGroupByDate = tabStorage.getItem(
      NOTES_DISPLAY_STORAGE_KEYS.legacyGroupByDate,
    );
    const sortField = tabStorage.getItem(NOTES_DISPLAY_STORAGE_KEYS.sortField);
    const sortDirection = tabStorage.getItem(
      NOTES_DISPLAY_STORAGE_KEYS.sortDirection,
    );

    return {
      viewMode: isViewMode(viewMode)
        ? viewMode
        : DEFAULT_NOTES_DISPLAY_PREFERENCES.viewMode,
      groupMode: isGroupMode(groupMode)
        ? groupMode
        : legacyGroupByDate === "false"
          ? "off"
          : DEFAULT_NOTES_DISPLAY_PREFERENCES.groupMode,
      sortField: isSortField(sortField)
        ? sortField
        : DEFAULT_NOTES_DISPLAY_PREFERENCES.sortField,
      sortDirection: isSortDirection(sortDirection)
        ? sortDirection
        : DEFAULT_NOTES_DISPLAY_PREFERENCES.sortDirection,
    };
  } catch {
    return DEFAULT_NOTES_DISPLAY_PREFERENCES;
  }
}

export function saveNotesViewMode(
  storage: StorageArea,
  viewMode: NotesViewMode,
): void {
  try {
    storage.setItem(NOTES_DISPLAY_STORAGE_KEYS.viewMode, viewMode);
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }
}

export function saveNotesSortPreferences(
  storage: StorageArea,
  preferences: Pick<
    NotesDisplayPreferences,
    "groupMode" | "sortField" | "sortDirection"
  >,
): void {
  try {
    storage.setItem(
      NOTES_DISPLAY_STORAGE_KEYS.groupMode,
      preferences.groupMode,
    );
    storage.setItem(
      NOTES_DISPLAY_STORAGE_KEYS.sortField,
      preferences.sortField,
    );
    storage.setItem(
      NOTES_DISPLAY_STORAGE_KEYS.sortDirection,
      preferences.sortDirection,
    );
    storage.removeItem(NOTES_DISPLAY_STORAGE_KEYS.legacyGroupByDate);
  } catch {
    // The in-memory preferences still work when storage is unavailable.
  }
}
