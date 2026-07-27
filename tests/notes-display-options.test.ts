import assert from "node:assert/strict";
import test from "node:test";
import { sortNotes } from "../lib/notes/note-utils";
import type { Note } from "../lib/notes/types";
import {
  DEFAULT_NOTES_DISPLAY_PREFERENCES,
  NOTES_DISPLAY_STORAGE_KEYS,
  clearNotesDisplayPreferences,
  loadNotesDisplayPreferences,
  saveNotesSortPreferences,
  saveNotesViewMode,
} from "../lib/notes/display-preferences";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function createNote(
  id: string,
  title: string,
  createdAt: string,
  displayCreatedAt: string,
): Note {
  return {
    id,
    slug: id,
    title,
    content: "",
    created_at: createdAt,
    display_created_at: displayCreatedAt,
    session_id: null,
    public: true,
  };
}

const notes = [
  createNote(
    "a",
    "Zulu",
    "2026-01-03T12:00:00.000Z",
    "2026-01-01T12:00:00.000Z",
  ),
  createNote(
    "b",
    "Alpha",
    "2026-01-01T12:00:00.000Z",
    "2026-01-03T12:00:00.000Z",
  ),
  createNote(
    "c",
    "Bravo",
    "2026-01-02T12:00:00.000Z",
    "2026-01-02T12:00:00.000Z",
  ),
];

test("sorts the default view by the normalized display date", () => {
  assert.deepEqual(
    sortNotes(notes, "default", "newest").map((note) => note.id),
    ["b", "c", "a"],
  );
});

test("sorts by the raw creation date independently", () => {
  assert.deepEqual(
    sortNotes(notes, "created", "newest").map((note) => note.id),
    ["a", "c", "b"],
  );
});

test("sorts titles ascending and descending", () => {
  assert.deepEqual(
    sortNotes(notes, "title", "newest").map((note) => note.title),
    ["Alpha", "Bravo", "Zulu"],
  );
  assert.deepEqual(
    sortNotes(notes, "title", "oldest").map((note) => note.title),
    ["Zulu", "Bravo", "Alpha"],
  );
});

test("uses the standard list defaults in a new tab", () => {
  const tabStorage = new MemoryStorage();

  assert.deepEqual(
    loadNotesDisplayPreferences(tabStorage),
    DEFAULT_NOTES_DISPLAY_PREFERENCES,
  );
});

test("restores display choices only from the current tab", () => {
  const firstTabStorage = new MemoryStorage();
  const secondTabStorage = new MemoryStorage();

  saveNotesViewMode(firstTabStorage, "gallery");
  saveNotesSortPreferences(firstTabStorage, {
    groupMode: "created",
    sortField: "created",
    sortDirection: "oldest",
  });

  assert.deepEqual(loadNotesDisplayPreferences(firstTabStorage), {
    viewMode: "gallery",
    groupMode: "created",
    sortField: "created",
    sortDirection: "oldest",
  });
  assert.deepEqual(
    loadNotesDisplayPreferences(secondTabStorage),
    DEFAULT_NOTES_DISPLAY_PREFERENCES,
  );
});

test("ignores and removes legacy durable display preferences", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  durableStorage.setItem(NOTES_DISPLAY_STORAGE_KEYS.viewMode, "gallery");
  durableStorage.setItem(NOTES_DISPLAY_STORAGE_KEYS.sortField, "title");

  assert.deepEqual(
    loadNotesDisplayPreferences(tabStorage, durableStorage),
    DEFAULT_NOTES_DISPLAY_PREFERENCES,
  );
  assert.equal(
    durableStorage.getItem(NOTES_DISPLAY_STORAGE_KEYS.viewMode),
    null,
  );
  assert.equal(
    durableStorage.getItem(NOTES_DISPLAY_STORAGE_KEYS.sortField),
    null,
  );
});

test("clears Notes display preferences when the app closes", () => {
  const tabStorage = new MemoryStorage();
  saveNotesViewMode(tabStorage, "gallery");
  saveNotesSortPreferences(tabStorage, {
    groupMode: "off",
    sortField: "title",
    sortDirection: "oldest",
  });

  clearNotesDisplayPreferences(tabStorage);

  assert.deepEqual(
    loadNotesDisplayPreferences(tabStorage),
    DEFAULT_NOTES_DISPLAY_PREFERENCES,
  );
});
