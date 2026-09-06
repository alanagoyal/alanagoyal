import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextSettingsSearchResultIndex,
  searchSettings,
} from "../components/apps/settings/search-items";

test("finds a specific setting by familiar language", () => {
  assert.deepEqual(searchSettings("running apps").map((item) => item.id), ["dock-indicators"]);
  assert.deepEqual(searchSettings("seconds").map((item) => item.id), ["clock"]);
});

test("returns the destination pane for subpanel settings", () => {
  const [storage] = searchSettings("disk space");

  assert.equal(storage.category, "general");
  assert.equal(storage.panel, "storage");
});

test("keeps top-level category names searchable", () => {
  assert.deepEqual(searchSettings("general").map((item) => item.id), ["general"]);
  assert.deepEqual(searchSettings("desktop & dock").map((item) => item.id), ["desktop-dock"]);
});

test("wraps Settings search keyboard navigation", () => {
  assert.equal(getNextSettingsSearchResultIndex(0, 3, 1), 1);
  assert.equal(getNextSettingsSearchResultIndex(2, 3, 1), 0);
  assert.equal(getNextSettingsSearchResultIndex(0, 3, -1), 2);
  assert.equal(getNextSettingsSearchResultIndex(0, 0, 1), 0);
});
