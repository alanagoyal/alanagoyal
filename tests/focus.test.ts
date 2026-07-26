import assert from "node:assert/strict";
import test from "node:test";

import { getEveningFocusEndTime } from "../lib/focus";

test("returns the same-day 7 PM cutoff before evening", () => {
  const now = new Date(2026, 6, 26, 18, 30, 45, 250);
  const expected = new Date(2026, 6, 26, 19, 0, 0, 0);

  assert.equal(getEveningFocusEndTime(now), expected.getTime());
});

test("does not offer an evening cutoff at exactly 7 PM", () => {
  const now = new Date(2026, 6, 26, 19, 0, 0, 0);

  assert.equal(getEveningFocusEndTime(now), null);
});

test("does not roll the evening cutoff into the next day", () => {
  const now = new Date(2026, 6, 26, 23, 30, 0, 0);

  assert.equal(getEveningFocusEndTime(now), null);
});
