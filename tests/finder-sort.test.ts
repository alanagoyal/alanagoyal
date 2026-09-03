import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextFinderSort,
  sortFinderEntries,
  type FinderSortableEntry,
} from "../lib/finder-sort";

const entries: FinderSortableEntry[] = [
  { name: "zeta.ts", kind: "TypeScript", modifiedAt: 20 },
  { name: "Folder 10", kind: "Folder", modifiedAt: 10 },
  { name: "folder 2", kind: "Folder", modifiedAt: 30 },
];

test("Finder sort uses native-feeling initial directions and reverses", () => {
  assert.deepEqual(getNextFinderSort(null, "name"), {
    key: "name",
    direction: "ascending",
  });
  assert.deepEqual(getNextFinderSort(null, "date"), {
    key: "date",
    direction: "descending",
  });
  assert.deepEqual(
    getNextFinderSort({ key: "name", direction: "ascending" }, "name"),
    { key: "name", direction: "descending" }
  );
});

test("Finder name sorting is case-insensitive and numeric", () => {
  assert.deepEqual(
    sortFinderEntries(entries, { key: "name", direction: "ascending" }).map(
      (entry) => entry.name
    ),
    ["folder 2", "Folder 10", "zeta.ts"]
  );
});

test("Finder kind sorting uses names as deterministic ties", () => {
  assert.deepEqual(
    sortFinderEntries(entries, { key: "kind", direction: "ascending" }).map(
      (entry) => entry.name
    ),
    ["folder 2", "Folder 10", "zeta.ts"]
  );
});

test("Finder date sorting supports newest and oldest first", () => {
  assert.deepEqual(
    sortFinderEntries(entries, { key: "date", direction: "descending" }).map(
      (entry) => entry.name
    ),
    ["folder 2", "zeta.ts", "Folder 10"]
  );
  assert.deepEqual(
    sortFinderEntries(entries, { key: "date", direction: "ascending" }).map(
      (entry) => entry.name
    ),
    ["Folder 10", "zeta.ts", "folder 2"]
  );
});
