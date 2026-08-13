import assert from "node:assert/strict";
import test from "node:test";

import {
  getFinderVisibleApps,
  getMobileDirectRouteRedirect,
  getMobileShellFallbackAppId,
  isAppSupportedOnMobile,
} from "../lib/app-availability";
import { APPS } from "../lib/app-config";
import { parseShellLocation } from "../lib/shell-routing";

const supportedAppIds = ["notes", "messages", "photos", "music", "calendar"];
const unsupportedAppIds = [
  "finder",
  "weather",
  "iterm",
  "games",
  "settings",
  "textedit",
  "preview",
];

test("declares the complete mobile support matrix explicitly", () => {
  assert.deepEqual(
    APPS.filter((app) => app.mobile.supported).map((app) => app.id),
    supportedAppIds
  );
  assert.deepEqual(
    APPS.filter((app) => !app.mobile.supported).map((app) => app.id),
    unsupportedAppIds
  );
  assert.equal(APPS.every((app) => typeof app.mobile.supported === "boolean"), true);
});

test("sends every unsupported mobile app to Notes", () => {
  for (const appId of unsupportedAppIds) {
    assert.equal(isAppSupportedOnMobile(appId), false);
    assert.equal(getMobileShellFallbackAppId(appId), "notes");
    assert.equal(getMobileDirectRouteRedirect(appId), "/notes");

    const location = parseShellLocation(`/${appId}/nested`, "?file=/example.txt", {
      context: "mobile",
    });
    assert.equal(location.appId, "notes");
    assert.equal(location.normalizedPathname, "/notes");
  }
});

test("keeps supported apps available in the mobile shell and Finder policy", () => {
  for (const appId of supportedAppIds) {
    assert.equal(isAppSupportedOnMobile(appId), true);
    assert.equal(getMobileShellFallbackAppId(appId), appId);
  }

  assert.deepEqual(
    getFinderVisibleApps("mobile").map((app) => app.id),
    supportedAppIds
  );
});

test("fails closed to Notes for unknown mobile app ids", () => {
  assert.equal(isAppSupportedOnMobile("unknown"), false);
  assert.equal(getMobileShellFallbackAppId("unknown"), "notes");
  assert.equal(getMobileDirectRouteRedirect("unknown"), "/notes");
});
