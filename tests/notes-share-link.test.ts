import assert from "node:assert/strict";
import test from "node:test";
import { getPublicNoteUrl } from "../lib/notes/share-link";

test("builds a public note URL from an origin and slug", () => {
  assert.equal(
    getPublicNoteUrl("https://alanagoyal.com", "about-me"),
    "https://alanagoyal.com/notes/about-me",
  );
});

test("normalizes the origin and encodes the slug", () => {
  assert.equal(
    getPublicNoteUrl("https://alanagoyal.com/", "hello world"),
    "https://alanagoyal.com/notes/hello%20world",
  );
});
