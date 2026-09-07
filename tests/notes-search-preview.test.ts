import assert from "node:assert/strict";
import test from "node:test";

import {
  getNotePreviewText,
  getNoteSearchPreviewText,
} from "../lib/notes/note-utils";
import { searchNotes } from "../lib/notes/search";
import type { Note } from "../lib/notes/types";

function makeNote(overrides: Partial<Note>): Note {
  return {
    id: "note-1",
    slug: "note-1",
    title: "Bookmarks",
    content: "Visible note text",
    created_at: "2026-09-05T12:00:00.000Z",
    session_id: null,
    public: true,
    ...overrides,
  };
}

test("shows context around a matching phrase in a long note", () => {
  const preview = getNoteSearchPreviewText(
    "Opening paragraph with background details. The decisive launch date is October 4 and the rest follows.",
    "launch date",
    36,
  );

  assert.match(preview, /^…/);
  assert.match(preview, /launch date is October 4/);
  assert.match(preview, /…$/);
});

test("falls back to the beginning when only the title matches", () => {
  assert.equal(
    getNoteSearchPreviewText("The body starts here", "missing title term"),
    "The body starts here",
  );
});

test("normalizes markdown before locating the match", () => {
  assert.equal(
    getNoteSearchPreviewText("## Plan\n- Ship the **search result**", "search result"),
    "Plan Ship the search result",
  );
});

test("removes Markdown markers without stripping semantic punctuation", () => {
  assert.equal(
    getNotePreviewText("## Languages\n- name-dropping\n- C++\n- C#"),
    "Languages name-dropping C++ C#",
  );
});

test("keeps the match near the start so it survives sidebar truncation", () => {
  const preview = getNoteSearchPreviewText(
    "The opposite of success isn't failure; it is name-dropping and posturing.",
    "name",
  );

  assert.ok(preview.indexOf("name") <= 19);
  assert.match(preview, /name-dropping/);
});

test("searches visible note text instead of hidden Markdown link targets", () => {
  const hiddenUrlMatch = makeNote({
    id: "hidden-url",
    slug: "hidden-url",
    content: "[Visible label](https://example.com/name-only)",
  });
  const visibleMatch = makeNote({
    id: "visible-match",
    slug: "visible-match",
    content: "My name is Alana",
  });

  assert.deepEqual(
    searchNotes([hiddenUrlMatch, visibleMatch], "name", "session-1").map(
      (note) => note.id,
    ),
    ["visible-match"],
  );
});
