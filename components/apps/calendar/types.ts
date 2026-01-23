export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm for timed events, undefined for all-day
  endTime?: string; // HH:mm
  isAllDay: boolean;
  calendarId: string;
  location?: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
}

export type ViewType = "day" | "week" | "month" | "year";

export interface CalendarState {
  currentDate: Date;
  view: ViewType;
  events: CalendarEvent[];
  calendars: Calendar[];
}
