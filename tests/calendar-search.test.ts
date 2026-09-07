import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_CALENDARS } from "../components/apps/calendar/data";
import {
  getCalendarEventSearchScrollTop,
  getNextCalendarSearchResultIndex,
  searchCalendarEvents,
} from "../components/apps/calendar/search-utils";
import type { CalendarEvent } from "../components/apps/calendar/types";

const referenceDate = new Date(2026, 8, 5);

test("searches generated event titles and locations", () => {
  const exerciseResults = searchCalendarEvents([], DEFAULT_CALENDARS, "exercise", referenceDate, 7);
  const locationResults = searchCalendarEvents([], DEFAULT_CALENDARS, "san francisco", referenceDate, 35);

  assert.ok(exerciseResults.length > 0);
  assert.ok(locationResults.some((event) => event.location?.includes("san francisco")));
});

test("puts upcoming matching events before past results", () => {
  const events: CalendarEvent[] = [
    { id: "past", title: "Board planning", startDate: "2026-09-01", endDate: "2026-09-01", startTime: "10:00", endTime: "11:00", isAllDay: false, calendarId: "meetings" },
    { id: "future", title: "Board dinner", startDate: "2026-09-08", endDate: "2026-09-08", startTime: "18:00", endTime: "20:00", isAllDay: false, calendarId: "meals" },
  ];

  assert.deepEqual(
    searchCalendarEvents(events, DEFAULT_CALENDARS, "board", referenceDate, 7).map((event) => event.id),
    ["future", "past"],
  );
});

test("searches stored events outside the generated-event window", () => {
  const events: CalendarEvent[] = [
    { id: "far-future", title: "Long-range planning", startDate: "2028-09-05", endDate: "2028-09-05", startTime: "10:00", endTime: "11:00", isAllDay: false, calendarId: "meetings" },
  ];

  assert.deepEqual(
    searchCalendarEvents(events, DEFAULT_CALENDARS, "long-range", referenceDate).map((event) => event.id),
    ["far-future"],
  );
});

test("wraps Calendar search result keyboard navigation", () => {
  assert.equal(getNextCalendarSearchResultIndex(0, 3, 1), 1);
  assert.equal(getNextCalendarSearchResultIndex(2, 3, 1), 0);
  assert.equal(getNextCalendarSearchResultIndex(0, 3, -1), 2);
  assert.equal(getNextCalendarSearchResultIndex(0, 0, 1), 0);
});

test("centers Calendar search selections around their start time", () => {
  const timedEvent: CalendarEvent = {
    id: "dinner",
    title: "Dinner",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    startTime: "18:30",
    endTime: "20:00",
    isAllDay: false,
    calendarId: "meals",
  };

  assert.equal(getCalendarEventSearchScrollTop(timedEvent), 910);
  assert.equal(
    getCalendarEventSearchScrollTop({ ...timedEvent, startTime: "01:00" }),
    0,
  );
  assert.equal(
    getCalendarEventSearchScrollTop({ ...timedEvent, isAllDay: true }),
    null,
  );
});
