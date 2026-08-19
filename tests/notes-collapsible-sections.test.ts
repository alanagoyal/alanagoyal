import assert from "node:assert/strict";
import test from "node:test";

import { getPrimaryCollapsibleHeadingLevel } from "../lib/notes/collapsible-sections";

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
