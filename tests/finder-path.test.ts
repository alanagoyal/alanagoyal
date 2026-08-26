import assert from "node:assert/strict";
import test from "node:test";
import {
  getFinderOpenDirectoryTarget,
  getFinderPathSegments,
  getFinderProjectRootTarget,
} from "../lib/finder-path";

test("maps only Finder-supported terminal directories", () => {
  assert.equal(
    getFinderOpenDirectoryTarget("/Users/alanagoyal/Desktop"),
    "/Users/alanagoyal/Desktop"
  );
  assert.equal(getFinderOpenDirectoryTarget("/Applications"), "applications");
  assert.equal(getFinderOpenDirectoryTarget("/"), null);
  assert.equal(getFinderOpenDirectoryTarget("/System"), null);
});

test("opens only existing GitHub project roots", () => {
  assert.equal(
    getFinderProjectRootTarget(
      "/Users/alanagoyal/Projects/alanagoyal",
      ["alanagoyal", "cli-crm"]
    ),
    "/Users/alanagoyal/Projects/alanagoyal"
  );
  assert.equal(
    getFinderProjectRootTarget(
      "/Users/alanagoyal/Projects/not-a-repo",
      ["alanagoyal", "cli-crm"]
    ),
    null
  );
  assert.equal(
    getFinderProjectRootTarget(
      "/Users/alanagoyal/Projects/alanagoyal/components",
      ["alanagoyal"]
    ),
    null
  );
});

test("builds clickable segments from the Finder section root", () => {
  assert.deepEqual(
    getFinderPathSegments("/Users/alanagoyal/Projects/alanagoyal/components/apps/finder"),
    [
      { label: "Projects", path: "/Users/alanagoyal/Projects" },
      { label: "alanagoyal", path: "/Users/alanagoyal/Projects/alanagoyal" },
      { label: "components", path: "/Users/alanagoyal/Projects/alanagoyal/components" },
      { label: "apps", path: "/Users/alanagoyal/Projects/alanagoyal/components/apps" },
      { label: "finder", path: "/Users/alanagoyal/Projects/alanagoyal/components/apps/finder" },
    ]
  );
});

test("keeps local and virtual roots concise", () => {
  assert.deepEqual(getFinderPathSegments("/Users/alanagoyal/Documents"), [
    { label: "Documents", path: "/Users/alanagoyal/Documents" },
  ]);
  assert.deepEqual(getFinderPathSegments("trash/unused-assets"), [
    { label: "Trash", path: "trash" },
    { label: "unused-assets", path: "trash/unused-assets" },
  ]);
});
