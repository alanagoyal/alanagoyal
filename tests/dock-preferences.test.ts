import assert from "node:assert/strict";
import test from "node:test";
import {
  isAppKeptInDock,
  parseDockKeepOverrides,
  parseShowDockIndicators,
  setAppKeptInDock,
} from "../lib/dock-preferences";
import { getDockSubmenuSide } from "../lib/desktop/dock-menu";
import { getDocumentAppPickerInstanceId } from "../lib/file-route-utils";

test("Dock keep overrides recover from malformed storage", () => {
  assert.deepEqual(parseDockKeepOverrides(null), {});
  assert.deepEqual(parseDockKeepOverrides("not-json"), {});
  assert.deepEqual(parseDockKeepOverrides(JSON.stringify(["weather"])), {});
  assert.deepEqual(
    parseDockKeepOverrides(JSON.stringify({ weather: true, music: false, bad: "yes", empty: null })),
    { weather: true, music: false }
  );
});

test("Dock open indicators default on and honor an explicit off preference", () => {
  assert.equal(parseShowDockIndicators(null), true);
  assert.equal(parseShowDockIndicators("true"), true);
  assert.equal(parseShowDockIndicators("false"), false);
  assert.equal(parseShowDockIndicators("malformed"), true);
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

test("Dock submenus choose the side with less viewport overflow", () => {
  assert.equal(
    getDockSubmenuSide({
      menuLeft: 551,
      menuRight: 711,
      submenuWidth: 160,
      viewportWidth: 768,
    }),
    "left"
  );
  assert.equal(
    getDockSubmenuSide({
      menuLeft: 300,
      menuRight: 460,
      submenuWidth: 160,
      viewportWidth: 1024,
    }),
    "right"
  );
});

test("document apps reuse stable, app-specific Finder picker identities", () => {
  assert.equal(getDocumentAppPickerInstanceId("textedit"), "finder-document-picker-textedit");
  assert.equal(getDocumentAppPickerInstanceId("preview"), "finder-document-picker-preview");
  assert.notEqual(
    getDocumentAppPickerInstanceId("textedit"),
    getDocumentAppPickerInstanceId("preview")
  );
});
