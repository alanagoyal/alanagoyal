import { Calendar } from "./types";

// Default calendars
export const DEFAULT_CALENDARS: Calendar[] = [
  {
    id: "holidays",
    name: "holidays",
    color: "#A0A0A5", // gray
  },
  {
    id: "exercise",
    name: "exercise",
    color: "#E25C5C", // muted red
  },
  {
    id: "focus",
    name: "focus",
    color: "#E89B4C", // muted orange
  },
  {
    id: "meetings",
    name: "meetings",
    color: "#D4B84A", // muted yellow
  },
  {
    id: "dinner",
    name: "dinner",
    color: "#5BBF72", // muted green
  },
];

// localStorage key
const CALENDARS_STORAGE_KEY = "calendar-calendars";

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
