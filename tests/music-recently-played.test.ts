import assert from "node:assert/strict";
import test from "node:test";
import type { PlaylistTrack } from "../components/apps/music/types";
import {
  parseRecentlyPlayedTracks,
  recordRecentlyPlayedTrack,
  serializeRecentlyPlayedTracks,
} from "../lib/music/recently-played";

function track(id: string, overrides: Partial<PlaylistTrack> = {}): PlaylistTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: "Artist",
    album: "Album",
    albumArt: `https://example.com/${id}.jpg`,
    previewUrl: `https://example.com/${id}.m4a`,
    duration: 30,
    ...overrides,
  };
}

test("recent listening history is unique and ordered newest first", () => {
  const first = track("first");
  const second = track("second");
  const third = track("third");

  assert.deepEqual(recordRecentlyPlayedTrack([first, second], second), [
    second,
    first,
  ]);
  assert.deepEqual(recordRecentlyPlayedTrack([second, first], third), [
    third,
    second,
    first,
  ]);
});

test("recent listening history keeps the latest eight tracks", () => {
  const tracks = ["2", "3", "4", "5", "6", "7", "8", "9"].map((id) =>
    track(id)
  );
  assert.deepEqual(
    recordRecentlyPlayedTrack(tracks, track("1")).map(({ id }) => id),
    ["1", "2", "3", "4", "5", "6", "7", "8"]
  );
});

test("stored listening history recovers complete unique track records", () => {
  const browseTrack = track("itunes-123", { name: "Browse result" });
  const libraryTrack = track("library-1");
  const serialized = serializeRecentlyPlayedTracks([browseTrack, libraryTrack]);

  assert.deepEqual(parseRecentlyPlayedTracks(serialized), [browseTrack, libraryTrack]);
});

test("stored listening history rejects malformed, duplicate, and legacy entries", () => {
  const first = track("one");
  const updatedFirst = track("one", { name: "Duplicate" });
  const second = track("two");

  assert.deepEqual(parseRecentlyPlayedTracks(null), []);
  assert.deepEqual(parseRecentlyPlayedTracks("not-json"), []);
  assert.deepEqual(parseRecentlyPlayedTracks(JSON.stringify({ track: first })), []);
  assert.deepEqual(
    parseRecentlyPlayedTracks(
      JSON.stringify([first, second, updatedFirst, null, 3, "legacy-id", {}])
    ),
    [first, second]
  );
});
