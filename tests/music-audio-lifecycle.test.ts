import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { JSDOM } from "jsdom";
import { AudioProvider, useAudio } from "../lib/music/audio-context";
import type { PlaylistTrack } from "../components/apps/music/types";

const dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost" });
const originals = new Map<string, PropertyDescriptor | undefined>();
class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  src = "";
  volume = 1;
  currentTime = 0;
  duration = 30;
  paused = true;
  error: { message: string } | null = null;
  constructor() { super(); FakeAudio.instances.push(this); }
  async play() { this.paused = false; this.dispatchEvent(new Event("playing")); }
  pause() { this.paused = true; }
}
const first: PlaylistTrack = {
  id: "first", name: "First", artist: "Artist", album: "Album",
  albumArt: "", previewUrl: "https://example.com/first.m4a", duration: 30,
};
const second = { ...first, id: "second", previewUrl: "https://example.com/second.m4a" };
before(() => {
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document,
    sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage,
    Audio: FakeAudio, IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
});
after(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  dom.window.close();
});

for (const strict of [false, true]) {
  test(`audio restores, handles events and releases playback (StrictMode=${strict})`, async () => {
    sessionStorage.clear(); localStorage.clear(); FakeAudio.instances = [];
    sessionStorage.setItem("music-playback-state", JSON.stringify({
      currentTrack: first, queue: [first, second], originalQueue: [first, second],
      queueIndex: 0, progress: 0.4, volume: 0.5,
    }));
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    let context!: ReturnType<typeof useAudio>;
    function Consumer() { context = useAudio(); return null; }
    // AudioProvider requires children in its props type for this non-JSX test.
    // eslint-disable-next-line react/no-children-prop
    const provider = createElement(AudioProvider, { children: createElement(Consumer) });
    try {
      await act(async () => { root.render(strict ? createElement(StrictMode, null, provider) : provider); });
      const audio = FakeAudio.instances.at(-1)!;
      assert.equal(audio.src, first.previewUrl);
      assert.equal(audio.paused, true, "restoration must not autoplay");
      await act(async () => { audio.dispatchEvent(new Event("loadedmetadata")); });
      assert.equal(context.playbackState.duration, 30);
      assert.equal(audio.currentTime, 12);
      await act(async () => { context.resume(); });
      assert.equal(context.recentlyPlayedTracks[0]?.id, first.id);
      await act(async () => { audio.dispatchEvent(new Event("ended")); });
      assert.equal(context.playbackState.currentTrack?.id, second.id);
      assert.equal(context.recentlyPlayedTracks[0]?.id, second.id);
      await act(async () => { context.pause(); context.previous(); });
      await act(async () => {
        audio.error = { message: "Unavailable preview" };
        audio.dispatchEvent(new Event("error"));
      });
      assert.equal(context.playbackState.error, "Unavailable preview");
      assert.equal(context.playbackState.isPlaying, false);
      await act(async () => { context.resume(); });
      assert.equal(audio.paused, false);
    } finally {
      await act(async () => { root.unmount(); });
      container.remove();
    }
    assert.ok(FakeAudio.instances.every((audio) => audio.paused), "unmount stops all owned audio");
  });
}
