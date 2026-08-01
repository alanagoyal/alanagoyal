import test from "node:test";
import assert from "node:assert/strict";
import type { CalendarEvent } from "../components/apps/calendar/types";
import { prioritizeUserEvents } from "../components/apps/calendar/utils";

function event(id: string): CalendarEvent {
  return {
    id,
    title: id,
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    startTime: "09:00",
    endTime: "10:00",
    isAllDay: false,
    calendarId: "events",
  };
}

test("keeps user-created events visible in capped Month cells", () => {
  const publicEvents = [event("public-1"), event("public-2"), event("public-3")];
  const userEvents = [event("owned-1"), event("owned-2")];

  const ordered = prioritizeUserEvents(
    [...publicEvents, ...userEvents],
    new Set(userEvents.map(({ id }) => id))
  );

  assert.deepEqual(
    ordered.map(({ id }) => id),
    ["owned-1", "owned-2", "public-1", "public-2", "public-3"]
  );
  assert.deepEqual(
    ordered.slice(0, 3).map(({ id }) => id),
    ["owned-1", "owned-2", "public-1"]
  );
});

test("preserves public event order when there are no user events", () => {
  const publicEvents = [event("public-1"), event("public-2")];

  assert.deepEqual(prioritizeUserEvents(publicEvents, new Set()), publicEvents);
});
