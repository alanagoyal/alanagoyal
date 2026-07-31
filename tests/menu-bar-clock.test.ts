import assert from "node:assert/strict";
import test from "node:test";
import {
  getDelayUntilNextClockRefresh,
  getMenuBarClockRefreshMs,
} from "../lib/menu-bar-clock";

test("digital clock refresh cadence follows its visible precision", () => {
  assert.equal(
    getMenuBarClockRefreshMs({
      clockStyle: "digital",
      flashSeparators: false,
      showSeconds: false,
    }),
    60_000
  );
  assert.equal(
    getMenuBarClockRefreshMs({
      clockStyle: "digital",
      flashSeparators: false,
      showSeconds: true,
    }),
    1_000
  );
  assert.equal(
    getMenuBarClockRefreshMs({
      clockStyle: "digital",
      flashSeparators: true,
      showSeconds: true,
    }),
    500
  );
});

test("analog clock ignores stored digital-only refresh preferences", () => {
  assert.equal(
    getMenuBarClockRefreshMs({
      clockStyle: "analog",
      flashSeparators: true,
      showSeconds: true,
    }),
    60_000
  );
});

test("clock refresh delay aligns updates to the next display boundary", () => {
  const twentyNineSecondsPastMinute = Date.UTC(2026, 6, 31, 12, 0, 29, 250);

  assert.equal(
    getDelayUntilNextClockRefresh(twentyNineSecondsPastMinute, 60_000),
    30_750
  );
  assert.equal(getDelayUntilNextClockRefresh(twentyNineSecondsPastMinute, 1_000), 750);
  assert.equal(getDelayUntilNextClockRefresh(twentyNineSecondsPastMinute, 500), 250);
  assert.equal(getDelayUntilNextClockRefresh(Date.UTC(2026, 6, 31, 12), 60_000), 60_000);
});
