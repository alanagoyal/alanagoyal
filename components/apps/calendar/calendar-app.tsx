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
import { loadEvents, saveEvents, loadCalendars } from "./data";

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
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Event form state
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventFormInitialDate, setEventFormInitialDate] = useState<Date | undefined>();
  const [eventFormInitialStartTime, setEventFormInitialStartTime] = useState<
    string | undefined
  >();
  const [eventFormInitialEndTime, setEventFormInitialEndTime] = useState<
    string | undefined
  >();

  // Load events and calendars on mount
  useEffect(() => {
    setEvents(loadEvents());
    setCalendars(loadCalendars());
    setIsLoaded(true);
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
    setEventFormInitialStartTime("09:00");
    setEventFormInitialEndTime("10:00");
    setEventFormOpen(true);
  }, [currentDate]);

  const handleCreateEvent = useCallback(
    (date: Date, startTime: string, endTime: string) => {
      setEventFormInitialDate(date);
      setEventFormInitialStartTime(startTime);
      setEventFormInitialEndTime(endTime);
      setEventFormOpen(true);
    },
    []
  );

  const handleSaveEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => {
      const updated = [...prev, event];
      saveEvents(updated);
      return updated;
    });
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
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            calendars={calendars}
            onCreateEvent={handleCreateEvent}
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

      {/* Event creation form */}
      <EventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        onSave={handleSaveEvent}
        calendars={calendars}
        initialDate={eventFormInitialDate}
        initialStartTime={eventFormInitialStartTime}
        initialEndTime={eventFormInitialEndTime}
        container={dialogContainer}
      />
    </div>
  );
}
