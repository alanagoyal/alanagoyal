import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachHourOfInterval,
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
  differenceInMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { CalendarEvent, ViewType } from "./types";

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

// Event helpers
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  const dayStr = format(day, "yyyy-MM-dd");

  return events.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    // Check if the day falls within the event range
    return dayStr >= eventStart && dayStr <= eventEnd;
  });
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
