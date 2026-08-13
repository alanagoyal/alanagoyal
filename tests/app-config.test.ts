import assert from "node:assert/strict";
import test from "node:test";

import { APPS, getAppsInDockOrder } from "../lib/app-config";

test("Dock order can differ from the shared app registry", () => {
  assert.deepEqual(APPS.slice(0, 3).map((app) => app.id), ["finder", "notes", "messages"]);
  assert.deepEqual(getAppsInDockOrder().slice(0, 3).map((app) => app.id), ["finder", "games", "notes"]);
});
