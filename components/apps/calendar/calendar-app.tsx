"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWindowFocus } from "@/lib/window-focus-context";
import { Nav } from "./nav";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { YearView } from "./year-view";
import { EventForm } from "./event-form";
import { ViewType, CalendarEvent, Calendar } from "./types";
import { navigateDate } from "./utils";
import { loadCalendars } from "./data";

// Valid view types for type guard
const VALID_VIEW_TYPES: ViewType[] = ["day", "week", "month", "year"];

function isValidViewType(value: string | null): value is ViewType {
  return value !== null && VALID_VIEW_TYPES.includes(value as ViewType);
}

// Validate that an object is a valid CalendarEvent
function isValidCalendarEvent(obj: unknown): obj is CalendarEvent {
  if (typeof obj !== "object" || obj === null) return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.title === "string" &&
    typeof e.startDate === "string" &&
    typeof e.endDate === "string" &&
    typeof e.isAllDay === "boolean" &&
    typeof e.calendarId === "string"
  );
}

// sessionStorage keys for view persistence (resets on new window/tab)
const VIEW_STORAGE_KEY = "calendar-view";
const DATE_STORAGE_KEY = "calendar-date";
const SCROLL_STORAGE_KEY = "calendar-scroll";

// Default hour height (must match TimeGrid default)
const DEFAULT_HOUR_HEIGHT = 60;

// Calculate scroll position to center around current time
function getDefaultScrollTop(): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Calculate pixel position of current time
  const currentTimePixels = (currentHour + currentMinute / 60) * DEFAULT_HOUR_HEIGHT;

  // Center it in viewport (assume ~400px visible area, so offset by ~200px)
  const centeredScroll = Math.max(0, currentTimePixels - 200);

  return centeredScroll;
}

// Load persisted view state from sessionStorage
function loadViewState(): { view: ViewType; currentDate: Date; scrollTop: number } {
  if (typeof window === "undefined") {
    return { view: "week", currentDate: new Date(), scrollTop: getDefaultScrollTop() };
  }

  try {
    const savedView = sessionStorage.getItem(VIEW_STORAGE_KEY);
    const savedDate = sessionStorage.getItem(DATE_STORAGE_KEY);
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);

    return {
      view: isValidViewType(savedView) ? savedView : "week",
      currentDate: savedDate ? new Date(savedDate) : new Date(),
      scrollTop: savedScroll ? parseInt(savedScroll, 10) : getDefaultScrollTop(),
    };
  } catch (error) {
    console.warn("Failed to load calendar view state:", error);
    return { view: "week", currentDate: new Date(), scrollTop: getDefaultScrollTop() };
  }
}

// Save view state to sessionStorage
function saveViewState(view: ViewType, currentDate: Date, scrollTop?: number): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
    sessionStorage.setItem(DATE_STORAGE_KEY, currentDate.toISOString());
    if (scrollTop !== undefined) {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, scrollTop.toString());
    }
  } catch {
    // ignore storage errors
  }
}

// Save just the scroll position (called frequently during scrolling)
function saveScrollPosition(scrollTop: number): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, scrollTop.toString());
  } catch {
    // ignore storage errors
  }
}

// User events storage key
const USER_EVENTS_KEY = "calendar-user-events";

// Load user-created events from localStorage
function loadUserEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(USER_EVENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Filter to only valid events, logging any invalid ones
        const validEvents = parsed.filter((item) => {
          const isValid = isValidCalendarEvent(item);
          if (!isValid) {
            console.warn("Invalid calendar event in storage, skipping:", item);
          }
          return isValid;
        });
        return validEvents;
      }
    }
  } catch (error) {
    console.warn("Failed to load calendar events:", error);
  }

  return [];
}

// Save user events to localStorage
function saveUserEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(USER_EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn("Failed to save calendar events:", error);
  }
}

interface CalendarAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

export function CalendarApp({ isMobile = false, inShell = false }: CalendarAppProps) {
  const windowFocus = useWindowFocus();
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogContainer =
    windowFocus?.dialogContainerRef?.current ?? containerRef.current;

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeGridScrollTop, setTimeGridScrollTop] = useState(0);

  // Event form state
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventFormInitialDate, setEventFormInitialDate] = useState<Date | undefined>();
  const [eventFormInitialEndDate, setEventFormInitialEndDate] = useState<Date | undefined>();
  const [eventFormInitialStartTime, setEventFormInitialStartTime] = useState<
    string | undefined
  >();
  const [eventFormInitialEndTime, setEventFormInitialEndTime] = useState<
    string | undefined
  >();

  // Selected event state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Event being edited
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  // Load events, calendars, and view state on mount
  useEffect(() => {
    // Load persisted view state from sessionStorage (resets on new window)
    const { view: savedView, currentDate: savedDate, scrollTop } = loadViewState();
    // On mobile, always use week view; on desktop use saved view (defaults to week)
    setView(isMobile ? "week" : savedView);
    setCurrentDate(savedDate);
    setTimeGridScrollTop(scrollTop);

    // Load user events and calendars (sample events are generated on-demand)
    setEvents(loadUserEvents());
    setCalendars(loadCalendars());
    setIsLoaded(true);
  }, [isMobile]);

  // Persist view state whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveViewState(view, currentDate);
    }
  }, [view, currentDate, isLoaded]);

  // Handle scroll position changes from TimeGrid
  const handleTimeGridScroll = useCallback((scrollTop: number) => {
    setTimeGridScrollTop(scrollTop);
    saveScrollPosition(scrollTop);
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((date) => navigateDate(date, direction, view));
    },
    [view]
  );

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView);
  }, []);

  // Event creation
  const handleNewEvent = useCallback(() => {
    setEventFormInitialDate(currentDate);
    setEventFormInitialEndDate(currentDate);
    setEventFormInitialStartTime("09:00");
    setEventFormInitialEndTime("10:00");
    setEventFormOpen(true);
  }, [currentDate]);

  const handleCreateEvent = useCallback(
    (date: Date, startTime: string, endTime: string) => {
      setEventFormInitialDate(date);
      setEventFormInitialEndDate(date);
      setEventFormInitialStartTime(startTime);
      setEventFormInitialEndTime(endTime);
      setEventFormOpen(true);
    },
    []
  );

  const handleSaveEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => {
      // Check if this is an update (event with same ID exists)
      const existingIndex = prev.findIndex((e) => e.id === event.id);
      let updated: CalendarEvent[];
      if (existingIndex >= 0) {
        // Update existing event
        updated = [...prev];
        updated[existingIndex] = event;
      } else {
        // Add new event
        updated = [...prev, event];
      }
      saveUserEvents(updated);
      return updated;
    });
    setEventToEdit(null);
  }, []);

  // Event selection
  const handleSelectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  // Event editing (double-click on user event)
  const handleEditEvent = useCallback((eventId: string) => {
    // Find the event in user events
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setEventToEdit(event);
      setEventFormOpen(true);
    }
  }, [events]);

  // Event deletion (only user events can be deleted)
  const handleDeleteEvent = useCallback((eventId: string) => {
    // Only delete if it's a user event (exists in our events state)
    setEvents((prev) => {
      const eventExists = prev.some((e) => e.id === eventId);
      if (!eventExists) return prev; // Can't delete sample/holiday events
      const updated = prev.filter((e) => e.id !== eventId);
      saveUserEvents(updated);
      return updated;
    });
    setSelectedEventId(null);
  }, []);

  // Date click handler (for navigating from year/month view)
  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView("day");
  }, []);

  const handleMonthClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView("month");
  }, []);

  // Keyboard shortcuts for view switching and event deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or if event form is open
      if (
        eventFormOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Only handle if calendar window is focused (when in shell)
      if (inShell && windowFocus && !windowFocus.isFocused) {
        return;
      }

      // Handle delete key for selected event
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEventId) {
        e.preventDefault();
        handleDeleteEvent(selectedEventId);
        return;
      }

      // Handle escape to deselect
      if (e.key === "Escape" && selectedEventId) {
        setSelectedEventId(null);
        return;
      }

      // Don't trigger view shortcuts with modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          setView("day");
          break;
        case "w":
          setView("week");
          break;
        case "m":
          setView("month");
          break;
        case "y":
          setView("year");
          break;
        case "t":
          setCurrentDate(new Date());
          break;
        case "arrowleft":
          handleNavigate("prev");
          break;
        case "arrowright":
          handleNavigate("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [eventFormOpen, inShell, windowFocus, handleNavigate, selectedEventId, handleDeleteEvent]);

  // Don't render until loaded to avoid hydration issues
  if (!isLoaded) {
    return <div className="h-full bg-background" />;
  }

  return (
    <div
      ref={containerRef}
      data-app="calendar"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="calendar-app h-full flex flex-col bg-background text-foreground relative outline-none overflow-hidden"
    >
      {/* Navigation bar */}
      <Nav
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onNewEvent={handleNewEvent}
        inShell={inShell}
        isMobile={isMobile}
      />

      {/* Calendar view */}
      <div className="flex-1 overflow-hidden">
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={events}
            calendars={calendars}
            onCreateEvent={handleCreateEvent}
            initialScrollTop={timeGridScrollTop}
            onScrollChange={handleTimeGridScroll}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            onEditEvent={handleEditEvent}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            calendars={calendars}
            onCreateEvent={isMobile ? undefined : handleCreateEvent}
            initialScrollTop={timeGridScrollTop}
            onScrollChange={handleTimeGridScroll}
            selectedEventId={isMobile ? null : selectedEventId}
            onSelectEvent={isMobile ? undefined : handleSelectEvent}
            onEditEvent={isMobile ? undefined : handleEditEvent}
            isMobile={isMobile}
            onNavigate={handleNavigate}
            onToday={handleToday}
          />
        )}
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            calendars={calendars}
            onCreateEvent={handleCreateEvent}
            onDateClick={handleDateClick}
          />
        )}
        {view === "year" && (
          <YearView
            currentDate={currentDate}
            onMonthClick={handleMonthClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Event creation/edit form */}
      <EventForm
        open={eventFormOpen}
        onOpenChange={(open) => {
          setEventFormOpen(open);
          if (!open) setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        calendars={calendars}
        initialDate={eventFormInitialDate}
        initialEndDate={eventFormInitialEndDate}
        initialStartTime={eventFormInitialStartTime}
        initialEndTime={eventFormInitialEndTime}
        container={dialogContainer}
        eventToEdit={eventToEdit}
      />
    </div>
  );
}
