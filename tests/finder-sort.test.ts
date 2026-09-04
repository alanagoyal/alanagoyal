import assert from "node:assert/strict";
import test from "node:test";

import {
  getDefaultFinderSort,
  getNextFinderSort,
  parseFinderSort,
  sortFinderEntries,
  type FinderSortableEntry,
} from "../lib/finder-sort";

const entries: FinderSortableEntry[] = [
  { name: "zeta.ts", kind: "TypeScript", modifiedAt: 20 },
  { name: "Folder 10", kind: "Folder", modifiedAt: 10 },
  { name: "folder 2", kind: "Folder", modifiedAt: 30 },
];

test("Finder restores valid sort metadata and rejects invalid saved values", () => {
  for (const key of ["name", "kind", "date"]) {
    for (const direction of ["ascending", "descending"]) {
      assert.deepEqual(parseFinderSort({ key, direction }), { key, direction });
    }
  }
  for (const value of [null, undefined, "name", [], {},
    { key: "size", direction: "ascending" },
    { key: "name", direction: "up" },
    { key: "name" },
  ]) {
    assert.equal(parseFinderSort(value), null);
  }
});

test("Finder defaults match the indicated column and reverse on first click", () => {
  const recentsSort = getDefaultFinderSort("recents");
  assert.deepEqual(recentsSort, { key: "date", direction: "descending" });
  assert.deepEqual(
    sortFinderEntries(entries, recentsSort).map((entry) => entry.name),
    ["folder 2", "zeta.ts", "Folder 10"]
  );
  assert.deepEqual(getNextFinderSort(recentsSort, "date"), {
    key: "date", direction: "ascending",
  });

  for (const path of ["applications", "/Users/alana/Documents", "trash"]) {
    const folderSort = getDefaultFinderSort(path);
    assert.deepEqual(folderSort, { key: "name", direction: "ascending" });
    assert.deepEqual(
      sortFinderEntries(entries, folderSort).map((entry) => entry.name),
      ["folder 2", "Folder 10", "zeta.ts"]
    );
    assert.deepEqual(getNextFinderSort(folderSort, "name"), {
      key: "name", direction: "descending",
    });
  }
});

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
