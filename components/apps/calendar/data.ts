import { Calendar, CalendarEvent } from "./types";

// Default calendars
export const DEFAULT_CALENDARS: Calendar[] = [
  {
    id: "holidays",
    name: "Holidays",
    color: "#007AFF", // Blue
  },
];

// Helper to get nth weekday of month
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

// Helper to get last weekday of month
function getLastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number
): Date {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  const diff = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - diff);
}

// Generate US holidays for a given year
function generateHolidaysForYear(year: number): CalendarEvent[] {
  const holidays: CalendarEvent[] = [];
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // New Year's Day - January 1
  holidays.push({
    id: `holiday-newyear-${year}`,
    title: "New Year's Day",
    startDate: formatDate(new Date(year, 0, 1)),
    endDate: formatDate(new Date(year, 0, 1)),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Martin Luther King Jr. Day - 3rd Monday of January
  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3);
  holidays.push({
    id: `holiday-mlk-${year}`,
    title: "Martin Luther King Jr. Day",
    startDate: formatDate(mlkDay),
    endDate: formatDate(mlkDay),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Presidents' Day - 3rd Monday of February
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  holidays.push({
    id: `holiday-presidents-${year}`,
    title: "Presidents' Day",
    startDate: formatDate(presidentsDay),
    endDate: formatDate(presidentsDay),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Memorial Day - Last Monday of May
  const memorialDay = getLastWeekdayOfMonth(year, 4, 1);
  holidays.push({
    id: `holiday-memorial-${year}`,
    title: "Memorial Day",
    startDate: formatDate(memorialDay),
    endDate: formatDate(memorialDay),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Independence Day - July 4
  holidays.push({
    id: `holiday-july4-${year}`,
    title: "Independence Day",
    startDate: formatDate(new Date(year, 6, 4)),
    endDate: formatDate(new Date(year, 6, 4)),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Labor Day - 1st Monday of September
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.push({
    id: `holiday-labor-${year}`,
    title: "Labor Day",
    startDate: formatDate(laborDay),
    endDate: formatDate(laborDay),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Columbus Day - 2nd Monday of October
  const columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2);
  holidays.push({
    id: `holiday-columbus-${year}`,
    title: "Columbus Day",
    startDate: formatDate(columbusDay),
    endDate: formatDate(columbusDay),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Veterans Day - November 11
  holidays.push({
    id: `holiday-veterans-${year}`,
    title: "Veterans Day",
    startDate: formatDate(new Date(year, 10, 11)),
    endDate: formatDate(new Date(year, 10, 11)),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Thanksgiving - 4th Thursday of November
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
  holidays.push({
    id: `holiday-thanksgiving-${year}`,
    title: "Thanksgiving",
    startDate: formatDate(thanksgiving),
    endDate: formatDate(thanksgiving),
    isAllDay: true,
    calendarId: "holidays",
  });

  // Christmas Day - December 25
  holidays.push({
    id: `holiday-christmas-${year}`,
    title: "Christmas Day",
    startDate: formatDate(new Date(year, 11, 25)),
    endDate: formatDate(new Date(year, 11, 25)),
    isAllDay: true,
    calendarId: "holidays",
  });

  return holidays;
}

// Generate holidays for 2025-2027
export const US_HOLIDAYS: CalendarEvent[] = [
  ...generateHolidaysForYear(2025),
  ...generateHolidaysForYear(2026),
  ...generateHolidaysForYear(2027),
];

// localStorage keys
const EVENTS_STORAGE_KEY = "calendar-events";
const CALENDARS_STORAGE_KEY = "calendar-calendars";

// Load events from localStorage
export function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return US_HOLIDAYS;

  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (stored) {
      const userEvents = JSON.parse(stored) as CalendarEvent[];
      // Merge with holidays (holidays always present)
      const holidayIds = new Set(US_HOLIDAYS.map((h) => h.id));
      const nonHolidayEvents = userEvents.filter((e) => !holidayIds.has(e.id));
      return [...US_HOLIDAYS, ...nonHolidayEvents];
    }
  } catch {
    // ignore parse errors
  }

  return US_HOLIDAYS;
}

// Save events to localStorage (only non-holiday events)
export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;

  const holidayIds = new Set(US_HOLIDAYS.map((h) => h.id));
  const userEvents = events.filter((e) => !holidayIds.has(e.id));

  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(userEvents));
  } catch {
    // ignore storage errors
  }
}

// Load calendars from localStorage
export function loadCalendars(): Calendar[] {
  if (typeof window === "undefined") return DEFAULT_CALENDARS;

  try {
    const stored = localStorage.getItem(CALENDARS_STORAGE_KEY);
    if (stored) {
      const userCalendars = JSON.parse(stored) as Calendar[];
      // Ensure holidays calendar is always present
      const hasHolidays = userCalendars.some((c) => c.id === "holidays");
      if (!hasHolidays) {
        return [DEFAULT_CALENDARS[0], ...userCalendars];
      }
      return userCalendars;
    }
  } catch {
    // ignore parse errors
  }

  return DEFAULT_CALENDARS;
}

// Save calendars to localStorage
export function saveCalendars(calendars: Calendar[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CALENDARS_STORAGE_KEY, JSON.stringify(calendars));
  } catch {
    // ignore storage errors
  }
}

// Generate a unique ID for new events
export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
