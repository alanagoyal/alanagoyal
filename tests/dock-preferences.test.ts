import assert from "node:assert/strict";
import test from "node:test";
import {
  isAppKeptInDock,
  parseDockKeepOverrides,
  setAppKeptInDock,
} from "../lib/dock-preferences";

test("Dock keep overrides recover from malformed storage", () => {
  assert.deepEqual(parseDockKeepOverrides(null), {});
  assert.deepEqual(parseDockKeepOverrides("not-json"), {});
  assert.deepEqual(parseDockKeepOverrides(JSON.stringify(["weather"])), {});
  assert.deepEqual(
    parseDockKeepOverrides(JSON.stringify({ weather: true, music: false, bad: "yes", empty: null })),
    { weather: true, music: false }
  );
});

test("registered Dock defaults apply until a user overrides them", () => {
  assert.equal(isAppKeptInDock({ id: "music" }, {}), true);
  assert.equal(isAppKeptInDock({ id: "weather", showOnDockByDefault: false }, {}), false);
  assert.equal(
    isAppKeptInDock({ id: "weather", showOnDockByDefault: false }, { weather: true }),
    true
  );
  assert.equal(isAppKeptInDock({ id: "music" }, { music: false }), false);
  assert.equal(isAppKeptInDock({ id: "finder", showOnDockByDefault: false }, { finder: false }), true);
});

test("returning to an app's registered default removes its stored override", () => {
  const weather = { id: "weather", showOnDockByDefault: false };
  const music = { id: "music" };

  assert.deepEqual(setAppKeptInDock({}, weather, true), { weather: true });
  assert.deepEqual(setAppKeptInDock({ weather: true }, weather, false), {});
  assert.deepEqual(setAppKeptInDock({}, music, false), { music: false });
  assert.deepEqual(setAppKeptInDock({ music: false }, music, true), {});
});
