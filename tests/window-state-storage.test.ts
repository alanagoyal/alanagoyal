import assert from "node:assert/strict";
import test from "node:test";

import {
  WINDOW_STATE_STORAGE_KEY,
  loadWindowStatePayload,
  saveWindowStatePayload,
} from "../lib/window-state-storage.ts";

class MemoryStorage {
  readonly values = new Map<string, string>();
  failReads = false;
  failWrites = false;

  getItem(key: string): string | null {
    if (this.failReads) throw new Error("read unavailable");
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("write unavailable");
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test("prefers tab-scoped state and removes a stale durable copy", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  tabStorage.values.set(WINDOW_STATE_STORAGE_KEY, "tab");
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "legacy");

  assert.equal(loadWindowStatePayload(tabStorage, durableStorage), "tab");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("migrates legacy durable state into tab storage", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "legacy");

  assert.equal(loadWindowStatePayload(tabStorage, durableStorage), "legacy");
  assert.equal(tabStorage.getItem(WINDOW_STATE_STORAGE_KEY), "legacy");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("keeps the legacy value when tab storage rejects the migration", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  tabStorage.failWrites = true;
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "legacy");

  assert.equal(loadWindowStatePayload(tabStorage, durableStorage), "legacy");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), "legacy");
});

test("saves new window state only to tab storage", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();

  saveWindowStatePayload(tabStorage, "current");

  assert.equal(tabStorage.getItem(WINDOW_STATE_STORAGE_KEY), "current");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("keeps separate tabs independent", () => {
  const firstTabStorage = new MemoryStorage();
  const secondTabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();

  saveWindowStatePayload(firstTabStorage, "first-tab");

  assert.equal(loadWindowStatePayload(firstTabStorage, durableStorage), "first-tab");
  assert.equal(loadWindowStatePayload(secondTabStorage, durableStorage), null);
});
