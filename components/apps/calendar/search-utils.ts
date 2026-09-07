import { addDays, format, parseISO } from "date-fns";
import { Calendar, CalendarEvent } from "./types";
import { getEventsForDay } from "./utils";

export function getNextCalendarSearchResultIndex(
  currentIndex: number,
  resultCount: number,
  direction: 1 | -1,
): number {
  if (resultCount <= 0) return 0;
  return (currentIndex + direction + resultCount) % resultCount;
}

export function getCalendarEventSearchScrollTop(
  event: CalendarEvent,
  hourHeight = 60,
  viewportCenterOffset = 200,
): number | null {
  if (event.isAllDay || !event.startTime) return null;

  const [hour, minute] = event.startTime.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const eventTop = (hour * 60 + minute) * (hourHeight / 60);
  return Math.max(0, eventTop - viewportCenterOffset);
}

export function searchCalendarEvents(
  events: CalendarEvent[],
  calendars: Calendar[],
  query: string,
  referenceDate: Date,
  dayRadius = 183,
  limit = 40,
): CalendarEvent[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const calendarNames = new Map(
    calendars.map((calendar) => [calendar.id, calendar.name.toLocaleLowerCase()]),
  );
  const results = new Map<string, CalendarEvent>();

  const matchesQuery = (event: CalendarEvent) =>
    [event.title, event.location, calendarNames.get(event.calendarId)]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);

  // Stored events are finite, so search all of them regardless of the date
  // currently shown in Calendar. The radius below only bounds generated data.
  for (const event of events) {
    if (matchesQuery(event)) results.set(event.id, event);
  }

  for (let offset = -dayRadius; offset <= dayRadius; offset += 1) {
    const day = addDays(referenceDate, offset);
    for (const event of getEventsForDay(events, day)) {
      if (matchesQuery(event)) results.set(event.id, event);
    }
  }

  const referenceDay = format(referenceDate, "yyyy-MM-dd");
  return [...results.values()]
    .sort((first, second) => {
      const firstIsFuture = first.startDate >= referenceDay;
      const secondIsFuture = second.startDate >= referenceDay;
      if (firstIsFuture !== secondIsFuture) return firstIsFuture ? -1 : 1;
      return firstIsFuture
        ? first.startDate.localeCompare(second.startDate)
        : second.startDate.localeCompare(first.startDate);
    })
    .slice(0, limit);
}

export function getCalendarEventDate(event: CalendarEvent): Date {
  return parseISO(event.startDate);
}
