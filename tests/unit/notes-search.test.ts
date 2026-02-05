import assert from "node:assert/strict";
import test from "node:test";
import { searchNotes } from "../../lib/notes/search";
import type { Note } from "../../lib/notes/types";

function createNote(partial: Partial<Note>): Note {
  return {
    id: partial.id ?? "id-1",
    slug: partial.slug ?? "note-1",
    title: partial.title ?? "",
    content: partial.content ?? "",
    created_at: partial.created_at ?? "2025-01-01T00:00:00.000Z",
    session_id: partial.session_id ?? "session-a",
    public: partial.public ?? false,
    emoji: partial.emoji,
    category: partial.category,
  };
}

test("searchNotes includes public and same-session private matches", () => {
  const notes: Note[] = [
    createNote({
      id: "n1",
      slug: "public-match",
      title: "Launch plan",
      content: "Milestones and dependencies",
      public: true,
      session_id: "session-other",
    }),
    createNote({
      id: "n2",
      slug: "private-match",
      title: "Personal launch checklist",
      content: "Draft and revise",
      public: false,
      session_id: "session-a",
    }),
    createNote({
      id: "n3",
      slug: "private-other-session",
      title: "Launch confidential",
      content: "Should not be visible",
      public: false,
      session_id: "session-b",
    }),
  ];

  const results = searchNotes(notes, "launch", "session-a");
  assert.deepEqual(
    results.map((note) => note.slug),
    ["public-match", "private-match"]
  );
});

test("searchNotes is case-insensitive and trims search term", () => {
  const notes: Note[] = [
    createNote({
      slug: "alpha",
      title: "Shopping List",
      content: "apples and oranges",
      public: true,
    }),
  ];

  const results = searchNotes(notes, "  APPLES ", "session-a");
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, "alpha");
});
