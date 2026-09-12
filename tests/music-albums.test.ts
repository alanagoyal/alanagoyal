import assert from "node:assert/strict";
import test from "node:test";

import { getAlbumsFromPlaylists } from "../components/apps/music/data";

test("album library groups unique tracks into playable queues", () => {
  const albums = getAlbumsFromPlaylists();
  const album = albums.find(
    (candidate) =>
      candidate.name === "Man On The Moon: The End Of Day (Deluxe)" &&
      candidate.artist === "Kid Cudi"
  );

  assert.ok(album);
  assert.equal(album.trackCount, album.tracks.length);
  assert.deepEqual(
    album.tracks.map((track) => track.name),
    ["Soundtrack 2 My Life", "Day 'N' Nite (nightmare)", "Man On The Moon"]
  );
  assert.ok(album.tracks.every((track) => track.album === album.name));
  assert.ok(album.tracks.every((track) => track.artist === album.artist));
});

test("album queues remove duplicate songs repeated across playlists", () => {
  const albums = getAlbumsFromPlaylists();
  const album = albums.find(
    (candidate) =>
      candidate.name === "Twelve Carat Toothache" &&
      candidate.artist === "Post Malone"
  );

  assert.ok(album);
  assert.equal(album.trackCount, 1);
  assert.deepEqual(album.tracks.map((track) => track.name), ["When I'm Alone"]);
});
