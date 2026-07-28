import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NoteMarkdownPreview } from "../components/apps/notes/note-markdown-preview";
import {
  NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS,
  getBoundedMarkdownPreview,
} from "../lib/notes/markdown-preview";

test("preserves Markdown that already fits in the preview limit", () => {
  const content = "## Heading\n\n- one\n- two";

  assert.equal(getBoundedMarkdownPreview(content), content);
});

test("bounds long Markdown at a nearby complete line", () => {
  const content = `${"a".repeat(90)}\n${"b".repeat(40)}`;

  assert.equal(getBoundedMarkdownPreview(content, 100), "a".repeat(90));
});

test("uses the hard limit when no useful line boundary exists", () => {
  const content = "a".repeat(NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS + 100);

  assert.equal(
    getBoundedMarkdownPreview(content).length,
    NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS,
  );
});

test("does not split supplementary Unicode characters", () => {
  assert.equal(getBoundedMarkdownPreview("abc😀def", 4), "abc");
});

test("supports an empty preview limit", () => {
  assert.equal(getBoundedMarkdownPreview("content", 0), "");
});

test("defers Markdown parsing until a preview reaches the viewport", () => {
  const markup = renderToStaticMarkup(
    createElement(NoteMarkdownPreview, {
      content: "# Deferred heading",
      deferUntilVisible: true,
      maxCharacters: NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS,
    }),
  );

  assert.match(markup, /data-note-preview-pending/);
  assert.doesNotMatch(markup, /Deferred heading/);
});

test("renders links and task controls as non-interactive preview content", () => {
  const markup = renderToStaticMarkup(
    createElement(NoteMarkdownPreview, {
      content: "- [x] [Completed](https://example.com)",
    }),
  );

  assert.doesNotMatch(markup, /<a(?:\s|>)/);
  assert.doesNotMatch(markup, /<input(?:\s|>)/);
  assert.match(markup, /note-markdown-preview-link/);
  assert.match(markup, /note-markdown-preview-checkbox-checked/);
});
