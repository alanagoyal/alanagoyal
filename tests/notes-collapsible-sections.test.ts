import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  clearCollapsedSections,
  getCollapsibleSectionKey,
  loadCollapsedSection,
  remarkCollapsibleSections,
  saveCollapsedSection,
} from "../lib/notes/collapsible-sections";

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

function renderMarkdown(markdown: string): string {
  return renderToStaticMarkup(
    React.createElement(
      ReactMarkdown,
      { remarkPlugins: [remarkGfm, remarkCollapsibleSections] },
      markdown,
    ),
  );
}

function countSections(html: string): number {
  return html.match(/data-collapsible-section=""/g)?.length ?? 0;
}

test("groups the most prominent repeated heading level", () => {
  const html = renderMarkdown(`
# Note title

## First section
Content

### Nested detail
More content

## Second section
Content
`);

  assert.equal(countSections(html), 2);
  assert.match(html, /^<h1>Note title<\/h1>\s*<section/);
  assert.match(html, /<section[^>]*><h2 data-collapsible-heading=""/);
  assert.match(html, /<h3>Nested detail<\/h3>/);
});

test("falls back to a single heading when no level repeats", () => {
  const html = renderMarkdown("Intro\n\n### One section\nContent");

  assert.equal(countSections(html), 1);
  assert.match(html, /data-section-key="3:one section"/);
});

test("ignores heading-like text inside fenced code blocks", () => {
  const html = renderMarkdown(
    [
      "```markdown",
      "## Not a section",
      "## Still code",
      "```",
      "",
      "### Real section",
      "Content",
    ].join("\n"),
  );

  assert.equal(countSections(html), 1);
  assert.match(html, /data-section-key="3:real section"/);
  assert.match(html, /<code class="language-markdown">## Not a section/);
});

test("leaves notes without headings unchanged", () => {
  const html = renderMarkdown("Just a paragraph.");

  assert.equal(countSections(html), 0);
  assert.equal(html, "<p>Just a paragraph.</p>");
});

test("keeps reference links available across collapsible sections", () => {
  const html = renderMarkdown(`
## First
See [Basecase][base].

## Second
Other text.

[base]: https://basecase.vc
`);

  assert.match(html, /<a href="https:\/\/basecase\.vc">Basecase<\/a>/);
  assert.doesNotMatch(html, /\[Basecase\]\[base\]/);
});

test("assigns duplicate headings independent persisted keys", () => {
  const html = renderMarkdown(`
## Update
First body

## Update
Second body
`);

  assert.match(html, /data-section-key="2:update"/);
  assert.match(html, /data-section-key="2:update:2"/);
});

test("ends a section at a more prominent heading", () => {
  const html = renderMarkdown(`
## First
First body

# Interlude
Outside body

## Second
Second body
`);

  assert.match(
    html,
    /First body<\/p><\/section>\s*<h1>Interlude<\/h1>\s*<p>Outside body<\/p>\s*<section/,
  );
});

test("normalizes heading identity for stable restoration", () => {
  assert.equal(getCollapsibleSectionKey(3, "  Currently\n now  "), "3:currently now");
  assert.equal(getCollapsibleSectionKey(3, "Currently now", 2), "3:currently now:2");
});

test("restores collapsed sections independently for each note", () => {
  const storage = new MemoryStorage();
  const current = getCollapsibleSectionKey(3, "currently");
  const previous = getCollapsibleSectionKey(3, "previously");

  saveCollapsedSection("about", current, true, storage);
  saveCollapsedSection("about", previous, true, storage);

  assert.equal(loadCollapsedSection("about", current, storage), true);
  assert.equal(loadCollapsedSection("about", previous, storage), true);
  assert.equal(loadCollapsedSection("another-note", current, storage), false);

  saveCollapsedSection("about", current, false, storage);
  assert.equal(loadCollapsedSection("about", current, storage), false);
  assert.equal(loadCollapsedSection("about", previous, storage), true);
});

test("clears persisted collapse state with the Notes view state", () => {
  const storage = new MemoryStorage();
  const section = getCollapsibleSectionKey(3, "currently");

  saveCollapsedSection("about", section, true, storage);
  clearCollapsedSections(storage);

  assert.equal(loadCollapsedSection("about", section, storage), false);
  assert.equal(storage.values.size, 0);
});

test("ignores malformed persisted collapse state", () => {
  const storage = new MemoryStorage();
  storage.setItem("notes-collapsed-sections", "{bad json");

  assert.equal(loadCollapsedSection("about", "3:currently", storage), false);
});
