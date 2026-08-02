import test from "node:test";
import assert from "node:assert/strict";
import { getUpcomingEventDefaults } from "../components/apps/calendar/utils";

function localDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

test("starts a new event at the next local half-hour", () => {
  const referenceDate = localDate(2026, 8, 12, 9, 0);
  const defaults = getUpcomingEventDefaults(
    referenceDate,
    localDate(2026, 8, 1, 16, 25)
  );

  assert.equal(defaults.startTime, "16:30");
  assert.equal(defaults.endTime, "17:30");
  assert.deepEqual(
    [
      defaults.startDate.getFullYear(),
      defaults.startDate.getMonth() + 1,
      defaults.startDate.getDate(),
    ],
    [2026, 8, 12]
  );
});

test("moves to the following slot when now is exactly on a half-hour", () => {
  const defaults = getUpcomingEventDefaults(
    localDate(2026, 8, 12, 9, 0),
    localDate(2026, 8, 1, 16, 30)
  );

  assert.equal(defaults.startTime, "17:00");
  assert.equal(defaults.endTime, "18:00");
});

test("carries the one-hour event across midnight", () => {
  const defaults = getUpcomingEventDefaults(
    localDate(2026, 8, 12, 9, 0),
    localDate(2026, 8, 1, 23, 25)
  );

  assert.equal(defaults.startTime, "23:30");
  assert.equal(defaults.endTime, "00:30");
  assert.equal(defaults.startDate.getDate(), 12);
  assert.equal(defaults.endDate.getDate(), 13);
});

test("advances the selected date when the next slot is midnight", () => {
  const defaults = getUpcomingEventDefaults(
    localDate(2026, 8, 12, 9, 0),
    localDate(2026, 8, 1, 23, 45)
  );

  assert.equal(defaults.startTime, "00:00");
  assert.equal(defaults.endTime, "01:00");
  assert.equal(defaults.startDate.getDate(), 13);
  assert.equal(defaults.endDate.getDate(), 13);
});
