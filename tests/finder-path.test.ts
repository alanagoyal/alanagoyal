import assert from "node:assert/strict";
import test from "node:test";
import { getFinderPathSegments } from "../lib/finder-path";

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
