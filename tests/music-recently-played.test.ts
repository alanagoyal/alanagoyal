import assert from "node:assert/strict";
import test from "node:test";
import {
  parseRecentlyPlayedTrackIds,
  recordRecentlyPlayedTrack,
  serializeRecentlyPlayedTrackIds,
} from "../lib/music/recently-played";

test("recent listening history is unique and ordered newest first", () => {
  assert.deepEqual(recordRecentlyPlayedTrack(["first", "second"], "second"), [
    "second",
    "first",
  ]);
  assert.deepEqual(recordRecentlyPlayedTrack(["second", "first"], "third"), [
    "third",
    "second",
    "first",
  ]);
});

test("recent listening history keeps the latest eight tracks", () => {
  assert.deepEqual(
    recordRecentlyPlayedTrack(
      ["2", "3", "4", "5", "6", "7", "8", "9"],
      "1"
    ),
    ["1", "2", "3", "4", "5", "6", "7", "8"]
  );
});

test("stored listening history recovers from malformed and duplicate values", () => {
  assert.deepEqual(parseRecentlyPlayedTrackIds(null), []);
  assert.deepEqual(parseRecentlyPlayedTrackIds("not-json"), []);
  assert.deepEqual(parseRecentlyPlayedTrackIds(JSON.stringify({ track: "one" })), []);
  assert.deepEqual(
    parseRecentlyPlayedTrackIds(JSON.stringify(["one", "two", "one", null, 3, ""])),
    ["one", "two"]
  );
  assert.equal(serializeRecentlyPlayedTrackIds(["one", "two"]), '["one","two"]');
});
