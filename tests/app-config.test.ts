import assert from "node:assert/strict";
import test from "node:test";

import {
  APPS,
  clampAppWindowSize,
  getAppById,
  getAppsInDockOrder,
  migrateAppWindowFrame,
} from "../lib/app-config";

test("Dock order can differ from the shared app registry", () => {
  assert.deepEqual(APPS.slice(0, 3).map((app) => app.id), ["finder", "notes", "messages"]);
  assert.deepEqual(getAppsInDockOrder().slice(0, 3).map((app) => app.id), ["finder", "games", "notes"]);
});

test("Photos cannot resize narrower than its desktop toolbar", () => {
  const photos = getAppById("photos");

  assert.ok(photos);
  assert.equal(photos.minSize.width, 960);
  assert.ok(photos.defaultSize.width >= photos.minSize.width);
  assert.deepEqual(clampAppWindowSize("photos", { width: 600, height: 500 }), {
    width: 960,
    height: 500,
  });
});

test("expanded restored windows stay inside the viewport's right edge", () => {
  assert.deepEqual(
    migrateAppWindowFrame(
      "photos",
      { x: 800, y: 60 },
      { width: 600, height: 500 },
      1440,
    ),
    {
      position: { x: 480, y: 60 },
      size: { width: 960, height: 500 },
    },
  );

  assert.deepEqual(
    migrateAppWindowFrame(
      "photos",
      { x: 200, y: 60 },
      { width: 960, height: 500 },
      1024,
    ),
    {
      position: { x: 200, y: 60 },
      size: { width: 960, height: 500 },
    },
  );

  assert.deepEqual(
    migrateAppWindowFrame(
      "photos",
      { x: 200, y: 60 },
      { width: 960, height: 200 },
      1024,
    ),
    {
      position: { x: 200, y: 60 },
      size: { width: 960, height: 450 },
    },
  );
});
