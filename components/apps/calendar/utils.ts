import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  getWeek,
} from "date-fns";
import { CalendarEvent, ViewType } from "./types";

// Date night restaurants (cycled through on Saturdays)
const DATE_NIGHT_RESTAURANTS = [
  { name: "3rd Cousin", address: "919 Cortland Ave, SF" },
  { name: "Foreign Cinema", address: "2534 Mission St, SF" },
  { name: "Flour + Water", address: "2401 Harrison St, SF" },
  { name: "Frances", address: "3870 17th St, SF" },
  { name: "Friends Only", address: "1501 California St, SF" },
  { name: "Itria", address: "3266 24th St, SF" },
  { name: "Kokkari", address: "200 Jackson St, SF" },
  { name: "Lupa Trattoria", address: "4109 24th St, SF" },
  { name: "La Ciccia", address: "291 30th St, SF" },
  { name: "Rich Table", address: "199 Gough St, SF" },
  { name: "Routier", address: "2801 California St, SF" },
  { name: "Sorrel", address: "3228 Sacramento St, SF" },
  { name: "Verjus", address: "550 Washington St, SF" },
  { name: "Via Aurelia", address: "300 Toni Stone Xing, SF" },
  { name: "Zuni Cafe", address: "1658 Market St, SF" },
];

// Get a consistent restaurant for a given Saturday (based on week number)
function getRestaurantForSaturday(date: Date): (typeof DATE_NIGHT_RESTAURANTS)[0] {
  const weekNumber = getWeek(date);
  const index = weekNumber % DATE_NIGHT_RESTAURANTS.length;
  return DATE_NIGHT_RESTAURANTS[index];
}

// Date night start times (2.5 hour duration)
const DATE_NIGHT_TIMES = [
  { start: "18:00", end: "20:30" },
  { start: "18:15", end: "20:45" },
  { start: "18:30", end: "21:00" },
];

// Get a consistent start time for date night (varies week to week)
function getDateNightTime(date: Date): (typeof DATE_NIGHT_TIMES)[0] {
  const weekNumber = getWeek(date);
  const index = weekNumber % DATE_NIGHT_TIMES.length;
  return DATE_NIGHT_TIMES[index];
}

// Meeting time patterns for weekdays - all 1-hour blocks with 30-min gaps between events
// Focus time ends at 13:00, meetings start at 13:30 earliest
// All patterns end by 17:30 to allow 30-min buffer before dinner/roundtable
const WEEKDAY_MEETING_PATTERNS = [
  [{ start: "13:30", end: "14:30" }, { start: "15:00", end: "16:00" }, { start: "16:30", end: "17:30" }],
  [{ start: "14:00", end: "15:00" }, { start: "15:30", end: "16:30" }], // lighter day
  [{ start: "13:30", end: "14:30" }, { start: "15:00", end: "16:00" }, { start: "16:30", end: "17:30" }],
  [{ start: "14:30", end: "15:30" }, { start: "16:00", end: "17:00" }], // lighter day
  [{ start: "13:30", end: "14:30" }, { start: "15:00", end: "16:00" }, { start: "16:30", end: "17:30" }],
  [{ start: "14:00", end: "15:00" }, { start: "16:00", end: "17:00" }], // lighter day
  [{ start: "13:30", end: "14:30" }, { start: "15:30", end: "16:30" }], // lighter day
  [{ start: "13:30", end: "14:30" }, { start: "15:00", end: "16:00" }, { start: "16:30", end: "17:30" }],
  [{ start: "14:30", end: "15:30" }, { start: "16:30", end: "17:30" }], // lighter day
  [{ start: "14:00", end: "15:00" }, { start: "15:30", end: "16:30" }], // lighter day
];

// Meeting time patterns for weekends - all 1-hour blocks with 30-min gaps
// All patterns end by 17:30 to allow 30-min buffer before date night/dinner
const WEEKEND_MEETING_PATTERNS = [
  [{ start: "14:00", end: "15:00" }, { start: "15:30", end: "16:30" }],
  [{ start: "13:30", end: "14:30" }, { start: "15:00", end: "16:00" }],
  [{ start: "15:00", end: "16:00" }, { start: "16:30", end: "17:30" }],
  [{ start: "14:30", end: "15:30" }], // very light day
  [{ start: "14:00", end: "15:00" }, { start: "16:00", end: "17:00" }],
  [{ start: "13:30", end: "14:30" }, { start: "15:30", end: "16:30" }],
  [{ start: "14:30", end: "15:30" }, { start: "16:30", end: "17:30" }],
];

// Get a deterministic pattern index based on the date (varies week to week)
function getPatternIndex(day: Date, patternCount: number): number {
  // Use week number + day of week to ensure different patterns each week
  const startOfYear = new Date(day.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((day.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysSinceStart / 7);
  const dayOfWeek = day.getDay();
  return (weekNumber * 3 + dayOfWeek) % patternCount;
}

// Generate sample events for any day (on-demand, no pre-generation needed)
function generateSampleEventsForDay(day: Date): CalendarEvent[] {
  const dateStr = format(day, "yyyy-MM-dd");
  const dayOfWeek = day.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  const events: CalendarEvent[] = [];

  // exercise - 7-8am every day
  events.push({
    id: `sample-exercise-${dateStr}`,
    title: "exercise",
    startDate: dateStr,
    endDate: dateStr,
    startTime: "07:00",
    endTime: "08:00",
    isAllDay: false,
    calendarId: "exercise",
  });

  // focus time - 9am-1pm every day
  events.push({
    id: `sample-focus-${dateStr}`,
    title: "focus time",
    startDate: dateStr,
    endDate: dateStr,
    startTime: "09:00",
    endTime: "13:00",
    isAllDay: false,
    calendarId: "focus",
  });

  if (isWeekday) {
    // Select a meeting pattern based on the date
    const patternIndex = getPatternIndex(day, WEEKDAY_MEETING_PATTERNS.length);
    const meetingPattern = WEEKDAY_MEETING_PATTERNS[patternIndex];

    meetingPattern.forEach((meeting, index) => {
      events.push({
        id: `sample-meeting${index + 1}-${dateStr}`,
        title: "busy",
        startDate: dateStr,
        endDate: dateStr,
        startTime: meeting.start,
        endTime: meeting.end,
        isAllDay: false,
        calendarId: "meetings",
      });
    });

    // Every 6 weeks on Tuesday: roundtable dinner instead of regular dinner
    const isTuesday = dayOfWeek === 2;
    const weekNumber = getWeek(day);
    const isRoundtableWeek = weekNumber % 6 === 0;

    if (isTuesday && isRoundtableWeek) {
      events.push({
        id: `sample-event-${dateStr}`,
        title: "event",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:00",
        endTime: "21:00",
        isAllDay: false,
        calendarId: "events",
        location: "flour + water, 2401 harrison st, sf",
      });
    } else {
      events.push({
        id: `sample-meals-${dateStr}`,
        title: "dinner",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:30",
        endTime: "19:30",
        isAllDay: false,
        calendarId: "meals",
      });
    }
  } else {
    // Check if it's an event Sunday (every 4 weeks)
    const weekNumber = getWeek(day);
    const isEventSunday = isSunday && weekNumber % 4 === 0;

    if (isEventSunday) {
      // Event replaces busy blocks on these Sundays
      events.push({
        id: `sample-sunday-event-${dateStr}`,
        title: "event",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "14:00",
        endTime: "16:00",
        isAllDay: false,
        calendarId: "events",
        location: "665 3rd st, san francisco, ca 94107",
      });
    } else {
      // Select a meeting pattern for weekends
      const patternIndex = getPatternIndex(day, WEEKEND_MEETING_PATTERNS.length);
      const meetingPattern = WEEKEND_MEETING_PATTERNS[patternIndex];

      meetingPattern.forEach((meeting, index) => {
        events.push({
          id: `sample-meeting${index + 1}-${dateStr}`,
          title: "busy",
          startDate: dateStr,
          endDate: dateStr,
          startTime: meeting.start,
          endTime: meeting.end,
          isAllDay: false,
          calendarId: "meetings",
        });
      });
    }

    if (isSaturday) {
      const restaurant = getRestaurantForSaturday(day);
      const dateNightTime = getDateNightTime(day);
      events.push({
        id: `sample-datenight-${dateStr}`,
        title: "date night",
        startDate: dateStr,
        endDate: dateStr,
        startTime: dateNightTime.start,
        endTime: dateNightTime.end,
        isAllDay: false,
        calendarId: "meals",
        location: `${restaurant.name.toLowerCase()}, ${restaurant.address.toLowerCase()}`,
      });
    } else if (isSunday) {
      events.push({
        id: `sample-meals-sunday-${dateStr}`,
        title: "dinner",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:30",
        endTime: "20:00",
        isAllDay: false,
        calendarId: "meals",
      });
    }
  }

  return events;
}

// Generate holidays for a specific day (on-demand)
function getHolidaysForDay(day: Date): CalendarEvent[] {
  const year = day.getFullYear();
  const month = day.getMonth();
  const date = day.getDate();
  const dateStr = format(day, "yyyy-MM-dd");
  const holidays: CalendarEvent[] = [];

  // Helper functions
  const getNthWeekday = (y: number, m: number, weekday: number, n: number): number => {
    const firstDay = new Date(y, m, 1);
    const firstWeekday = firstDay.getDay();
    return 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  };

  const getLastWeekday = (y: number, m: number, weekday: number): number => {
    const lastDay = new Date(y, m + 1, 0);
    const lastWeekday = lastDay.getDay();
    const diff = (lastWeekday - weekday + 7) % 7;
    return lastDay.getDate() - diff;
  };

  // Check each holiday
  if (month === 0 && date === 1) {
    holidays.push({ id: `holiday-newyear-${year}`, title: "new year's day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 0 && date === getNthWeekday(year, 0, 1, 3)) {
    holidays.push({ id: `holiday-mlk-${year}`, title: "martin luther king jr. day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 1 && date === getNthWeekday(year, 1, 1, 3)) {
    holidays.push({ id: `holiday-presidents-${year}`, title: "presidents' day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 4 && date === getLastWeekday(year, 4, 1)) {
    holidays.push({ id: `holiday-memorial-${year}`, title: "memorial day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 6 && date === 4) {
    holidays.push({ id: `holiday-july4-${year}`, title: "independence day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 8 && date === getNthWeekday(year, 8, 1, 1)) {
    holidays.push({ id: `holiday-labor-${year}`, title: "labor day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 9 && date === getNthWeekday(year, 9, 1, 2)) {
    holidays.push({ id: `holiday-columbus-${year}`, title: "columbus day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 10 && date === 11) {
    holidays.push({ id: `holiday-veterans-${year}`, title: "veterans day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 10 && date === getNthWeekday(year, 10, 4, 4)) {
    holidays.push({ id: `holiday-thanksgiving-${year}`, title: "thanksgiving", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }
  if (month === 11 && date === 25) {
    holidays.push({ id: `holiday-christmas-${year}`, title: "christmas day", startDate: dateStr, endDate: dateStr, isAllDay: true, calendarId: "holidays" });
  }

  return holidays;
}

// Navigation helpers
export function navigateDate(
  date: Date,
  direction: "prev" | "next",
  view: ViewType
): Date {
  const add = direction === "next";
  switch (view) {
    case "day":
      return add ? addDays(date, 1) : subDays(date, 1);
    case "week":
      return add ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month":
      return add ? addMonths(date, 1) : subMonths(date, 1);
    case "year":
      return add ? addYears(date, 1) : subYears(date, 1);
  }
}

// Get days for month view (includes days from adjacent months)
export function getMonthViewDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart);
  const end = endOfWeek(monthEnd);

  return eachDayOfInterval({ start, end });
}

// Get days for week view
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  const end = endOfWeek(date);

  return eachDayOfInterval({ start, end });
}

// Get hours for day/week time grid
export function getDayHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

// Format helpers
export function formatDateHeader(date: Date, view: ViewType): string {
  switch (view) {
    case "day":
      return format(date, "MMMM d, yyyy");
    case "week":
    case "month":
      return format(date, "MMMM yyyy");
    case "year":
      return format(date, "yyyy");
  }
}

export function formatDayOfWeek(date: Date): string {
  return format(date, "EEEE");
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "Noon";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function formatWeekDayHeader(date: Date): string {
  return format(date, "EEE d");
}

// Event helpers - merges user events with on-demand generated sample events and holidays
export function getEventsForDay(
  userEvents: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  const dayStr = format(day, "yyyy-MM-dd");

  // User events that fall on this day
  const userEventsForDay = userEvents.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;
    return dayStr >= eventStart && dayStr <= eventEnd;
  });

  // Generate sample events and holidays on-demand
  const sampleEvents = generateSampleEventsForDay(day);
  const holidays = getHolidaysForDay(day);

  return [...holidays, ...sampleEvents, ...userEventsForDay];
}

export function getEventsForDateRange(
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] {
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return events.filter((event) => {
    // Event overlaps with range if event starts before range ends AND event ends after range starts
    return event.startDate <= endStr && event.endDate >= startStr;
  });
}

// Calculate event position in time grid (for day/week views)
export function getEventTimePosition(event: CalendarEvent): {
  top: number;
  height: number;
} {
  if (event.isAllDay || !event.startTime || !event.endTime) {
    return { top: 0, height: 0 };
  }

  const [startHour, startMin] = event.startTime.split(":").map(Number);
  const [endHour, endMin] = event.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Each hour is 60px tall
  const hourHeight = 60;
  const top = (startMinutes / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;

  // Subtract 2px for visual gap between back-to-back events
  return { top, height: Math.max(height - 2, 15) };
}

// Round time to nearest 15 minutes
export function roundToNearest15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

// Convert pixel position to time
// Returns hour in range [0, 24] where 24:00 represents midnight/end of day
export function pixelToTime(
  pixelY: number,
  hourHeight: number = 60
): { hour: number; minute: number } {
  const totalMinutes = (pixelY / hourHeight) * 60;
  // Clamp to valid range [0, 1440] (0:00 to 24:00)
  const clampedMinutes = Math.max(0, Math.min(24 * 60, totalMinutes));
  const roundedMinutes = roundToNearest15(clampedMinutes);

  // Calculate hour and minute
  let hour = Math.floor(roundedMinutes / 60);
  let minute = roundedMinutes % 60;

  // Clamp hour to [0, 24], and if hour is 24, minute must be 0
  hour = Math.min(24, Math.max(0, hour));
  if (hour === 24) {
    minute = 0;
  }

  return { hour, minute };
}

// Format time for display
export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

// Format event time string (HH:mm) to 12-hour format (e.g., "7am", "1:30pm")
export function formatEventTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(":").map(Number);
  // Handle 24:00 as midnight (end of day)
  const displayHour = hour === 24 ? 0 : hour;
  const h = displayHour % 12 || 12;
  const ampm = displayHour < 12 ? "am" : "pm";
  if (minute === 0) {
    return `${h}${ampm}`;
  }
  return `${h}:${minute.toString().padStart(2, "0")}${ampm}`;
}

// Format time as HH:mm
export function formatTimeValue(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

// Parse HH:mm to hour and minute
export function parseTimeValue(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

// Check if a date is today
export { isToday, isSameDay, isSameMonth, format, parseISO };

// Get all months in a year
export function getYearMonths(year: number): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}
