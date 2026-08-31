import assert from "node:assert/strict";
import test from "node:test";
import {
  getPhotoGridColumnClassName,
  loadPhotoGridSize,
  resizePhotoGrid,
  savePhotoGridSize,
} from "../lib/photos/grid-size";

function createStorage(initialValue: string | null = null) {
  const values = new Map<string, string>();
  if (initialValue !== null) values.set("photos-grid-size", initialValue);

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("Photos grid size defaults safely and persists valid choices", () => {
  assert.equal(loadPhotoGridSize(createStorage()), "standard");
  assert.equal(loadPhotoGridSize(createStorage("unknown")), "standard");

  const storage = createStorage();
  savePhotoGridSize("comfortable", storage);
  assert.equal(loadPhotoGridSize(storage), "comfortable");
});

test("Photos grid resizing stops at both thumbnail-size limits", () => {
  assert.equal(resizePhotoGrid("standard", "smaller"), "compact");
  assert.equal(resizePhotoGrid("standard", "larger"), "comfortable");
  assert.equal(resizePhotoGrid("compact", "smaller"), "compact");
  assert.equal(resizePhotoGrid("comfortable", "larger"), "comfortable");
});

test("Photos grid sizes change desktop density without changing mobile", () => {
  assert.equal(getPhotoGridColumnClassName("compact", false), "grid-cols-6");
  assert.equal(getPhotoGridColumnClassName("standard", false), "grid-cols-5");
  assert.equal(getPhotoGridColumnClassName("comfortable", false), "grid-cols-4");
  assert.equal(getPhotoGridColumnClassName("compact", true), "grid-cols-3");
  assert.equal(getPhotoGridColumnClassName("standard", true), "grid-cols-3");
  assert.equal(getPhotoGridColumnClassName("comfortable", true), "grid-cols-3");
});
