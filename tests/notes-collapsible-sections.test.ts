import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCollapsedSections,
  getCollapsibleSectionKey,
  getPrimaryCollapsibleHeadingLevel,
  loadCollapsedSection,
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

test("uses the most prominent repeated heading level", () => {
  assert.equal(
    getPrimaryCollapsibleHeadingLevel(`
# Note title

## First section
Content

### Nested detail
More content

## Second section
Content
`),
    2,
  );
});

test("falls back to a single heading when no level repeats", () => {
  assert.equal(
    getPrimaryCollapsibleHeadingLevel("Intro\n\n### One section\nContent"),
    3,
  );
});

test("ignores heading-like text inside fenced code blocks", () => {
  assert.equal(
    getPrimaryCollapsibleHeadingLevel(`
\`\`\`markdown
## Not a section
## Still code
\`\`\`

### Real section
Content
`),
    3,
  );
});

test("returns null when the note has no headings", () => {
  assert.equal(getPrimaryCollapsibleHeadingLevel("Just a paragraph."), null);
});

test("normalizes heading identity for stable restoration", () => {
  assert.equal(getCollapsibleSectionKey(3, "  Currently\n now  "), "3:currently now");
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
