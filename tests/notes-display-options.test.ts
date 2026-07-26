import assert from "node:assert/strict";
import test from "node:test";
import { sortNotes } from "../lib/notes/note-utils";
import type { Note } from "../lib/notes/types";

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
