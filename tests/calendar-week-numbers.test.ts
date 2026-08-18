import assert from "node:assert/strict";
import test from "node:test";
import { getCalendarWeekNumber } from "../components/apps/calendar/utils";

test("uses Sunday-based US calendar week numbers", () => {
  assert.equal(getCalendarWeekNumber(new Date(2026, 7, 16)), 34);
  assert.equal(getCalendarWeekNumber(new Date(2026, 7, 22)), 34);
  assert.equal(getCalendarWeekNumber(new Date(2026, 7, 23)), 35);
});

test("starts week one with the Sunday containing January 1", () => {
  assert.equal(getCalendarWeekNumber(new Date(2026, 11, 27)), 1);
  assert.equal(getCalendarWeekNumber(new Date(2027, 0, 2)), 1);
  assert.equal(getCalendarWeekNumber(new Date(2027, 0, 3)), 2);
});
