import assert from "node:assert/strict";
import test from "node:test";

import {
  WINDOW_STATE_STORAGE_KEY,
  loadWindowState,
  saveWindowStatePayload,
} from "../lib/window-state-storage";

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

const deserialize = (value: string): string | null =>
  value.startsWith("valid:") ? value : null;

test("prefers tab-scoped state and removes a stale durable copy", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  tabStorage.values.set(WINDOW_STATE_STORAGE_KEY, "valid:tab");
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "valid:legacy");

  assert.equal(
    loadWindowState(tabStorage, durableStorage, deserialize),
    "valid:tab"
  );
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("migrates legacy durable state into tab storage", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "valid:legacy");

  assert.equal(
    loadWindowState(tabStorage, durableStorage, deserialize),
    "valid:legacy"
  );
  assert.equal(tabStorage.getItem(WINDOW_STATE_STORAGE_KEY), "valid:legacy");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("falls back to valid durable state before removing an invalid tab value", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  tabStorage.values.set(WINDOW_STATE_STORAGE_KEY, "invalid");
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "valid:legacy");

  assert.equal(
    loadWindowState(tabStorage, durableStorage, deserialize),
    "valid:legacy"
  );
  assert.equal(tabStorage.getItem(WINDOW_STATE_STORAGE_KEY), "valid:legacy");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("keeps the legacy value when tab storage rejects the migration", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();
  tabStorage.failWrites = true;
  durableStorage.values.set(WINDOW_STATE_STORAGE_KEY, "valid:legacy");

  assert.equal(
    loadWindowState(tabStorage, durableStorage, deserialize),
    "valid:legacy"
  );
  assert.equal(
    durableStorage.getItem(WINDOW_STATE_STORAGE_KEY),
    "valid:legacy"
  );
});

test("saves new window state only to tab storage", () => {
  const tabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();

  saveWindowStatePayload(tabStorage, "valid:current");

  assert.equal(tabStorage.getItem(WINDOW_STATE_STORAGE_KEY), "valid:current");
  assert.equal(durableStorage.getItem(WINDOW_STATE_STORAGE_KEY), null);
});

test("keeps separate tabs independent", () => {
  const firstTabStorage = new MemoryStorage();
  const secondTabStorage = new MemoryStorage();
  const durableStorage = new MemoryStorage();

  saveWindowStatePayload(firstTabStorage, "valid:first-tab");

  assert.equal(
    loadWindowState(firstTabStorage, durableStorage, deserialize),
    "valid:first-tab"
  );
  assert.equal(
    loadWindowState(secondTabStorage, durableStorage, deserialize),
    null
  );
});
