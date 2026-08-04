import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFavoriteSongIds,
  serializeFavoriteSongIds,
} from "../lib/music/favorites";

test("favorite song ids round-trip without duplicates", () => {
  const stored = serializeFavoriteSongIds(["hh1", "ec1", "hh1"]);
  assert.deepEqual(parseFavoriteSongIds(stored), ["hh1", "ec1"]);
});

test("favorite song ids ignore malformed entries", () => {
  assert.deepEqual(
    parseFavoriteSongIds(JSON.stringify(["hh1", 42, "", null, "hh2"])),
    ["hh1", "hh2"]
  );
});

test("favorite song ids recover from invalid storage", () => {
  assert.deepEqual(parseFavoriteSongIds("not-json"), []);
  assert.deepEqual(parseFavoriteSongIds(JSON.stringify({ id: "hh1" })), []);
});
