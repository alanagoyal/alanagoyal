import assert from "node:assert/strict";
import test from "node:test";

import {
  clearPhotosState,
  loadPhotosRotations,
  loadPhotosShowGrid,
  savePhotosRotations,
  savePhotosShowGrid,
} from "../lib/sidebar-persistence";

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

test("restores photo rotations only from the current tab", () => {
  const firstTabStorage = new MemoryStorage();
  const secondTabStorage = new MemoryStorage();

  savePhotosRotations(
    {
      "photo-one": -90,
      "photo-two": -180,
    },
    firstTabStorage,
  );

  assert.deepEqual(loadPhotosRotations(firstTabStorage), {
    "photo-one": -90,
    "photo-two": -180,
  });
  assert.deepEqual(loadPhotosRotations(secondTabStorage), {});
});

test("ignores malformed photo rotation entries", () => {
  const tabStorage = new MemoryStorage();
  tabStorage.setItem(
    "photos-rotations",
    JSON.stringify({
      valid: -270,
      "not-a-quarter-turn": 45,
      "not-a-number": "90",
    }),
  );

  assert.deepEqual(loadPhotosRotations(tabStorage), {
    valid: -270,
  });
});

test("opens Photos content by default and restores the mobile menu on refresh", () => {
  const tabStorage = new MemoryStorage();

  assert.equal(loadPhotosShowGrid(tabStorage), true);

  savePhotosShowGrid(false, tabStorage);

  assert.equal(loadPhotosShowGrid(tabStorage), false);
});

test("clears photo rotations with the rest of Photos view state", () => {
  const tabStorage = new MemoryStorage();
  savePhotosRotations({ "photo-one": -90 }, tabStorage);
  savePhotosShowGrid(false, tabStorage);

  clearPhotosState(tabStorage);

  assert.deepEqual(loadPhotosRotations(tabStorage), {});
  assert.equal(loadPhotosShowGrid(tabStorage), true);
});
