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
} from "date-fns";
import { CalendarEvent, ViewType } from "./types";

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
    events.push({
      id: `sample-meeting1-${dateStr}`,
      title: "busy",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "13:30",
      endTime: "14:30",
      isAllDay: false,
      calendarId: "meetings",
    });
    events.push({
      id: `sample-meeting2-${dateStr}`,
      title: "busy",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "15:00",
      endTime: "16:00",
      isAllDay: false,
      calendarId: "meetings",
    });
    events.push({
      id: `sample-meeting3-${dateStr}`,
      title: "busy",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "16:30",
      endTime: "17:30",
      isAllDay: false,
      calendarId: "meetings",
    });
    events.push({
      id: `sample-dinner-${dateStr}`,
      title: "dinner",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "18:30",
      endTime: "19:30",
      isAllDay: false,
      calendarId: "dinner",
    });
  } else {
    events.push({
      id: `sample-meeting1-${dateStr}`,
      title: "busy",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "14:00",
      endTime: "15:00",
      isAllDay: false,
      calendarId: "meetings",
    });
    events.push({
      id: `sample-meeting2-${dateStr}`,
      title: "busy",
      startDate: dateStr,
      endDate: dateStr,
      startTime: "15:30",
      endTime: "16:30",
      isAllDay: false,
      calendarId: "meetings",
    });

    if (isSaturday) {
      events.push({
        id: `sample-datenight-${dateStr}`,
        title: "date night",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:30",
        endTime: "21:00",
        isAllDay: false,
        calendarId: "dinner",
      });
    } else if (isSunday) {
      events.push({
        id: `sample-dinner-sunday-${dateStr}`,
        title: "dinner",
        startDate: dateStr,
        endDate: dateStr,
        startTime: "18:30",
        endTime: "20:00",
        isAllDay: false,
        calendarId: "dinner",
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

  return { top, height: Math.max(height, 15) }; // Minimum 15px height
}

// Round time to nearest 15 minutes
export function roundToNearest15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

// Convert pixel position to time
export function pixelToTime(
  pixelY: number,
  hourHeight: number = 60
): { hour: number; minute: number } {
  const totalMinutes = (pixelY / hourHeight) * 60;
  const roundedMinutes = roundToNearest15(totalMinutes);
  const hour = Math.floor(roundedMinutes / 60);
  const minute = roundedMinutes % 60;

  return { hour: Math.min(23, Math.max(0, hour)), minute };
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
