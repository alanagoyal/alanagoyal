import assert from "node:assert/strict";
import test from "node:test";

import {
  clearMusicState,
  loadMusicShowContent,
  saveMusicShowContent,
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

test("opens Music content by default and restores the mobile sidebar on refresh", () => {
  const tabStorage = new MemoryStorage();

  assert.equal(loadMusicShowContent(tabStorage), true);

  saveMusicShowContent(false, tabStorage);

  assert.equal(loadMusicShowContent(tabStorage), false);

  clearMusicState(tabStorage);

  assert.equal(loadMusicShowContent(tabStorage), true);
});
