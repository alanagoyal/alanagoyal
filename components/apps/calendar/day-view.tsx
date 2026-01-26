"use client";

import { formatDateHeader, formatDayOfWeek } from "./utils";
import { TimeGrid } from "./time-grid";
import { AllDayRow } from "./all-day-row";
import { CalendarEvent, Calendar } from "./types";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent: (date: Date, startTime: string, endTime: string) => void;
  initialScrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string | null) => void;
  onEditEvent?: (eventId: string) => void;
}

export function DayView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
  initialScrollTop,
  onScrollChange,
  selectedEventId,
  onSelectEvent,
  onEditEvent,
}: DayViewProps) {
  const dates = [currentDate];

  return (
    <div className="flex flex-col h-full">
      {/* Date header */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "day")}
        </h1>
        <p className="text-muted-foreground">{formatDayOfWeek(currentDate)}</p>
      </div>

      {/* All-day events */}
      <AllDayRow
        dates={dates}
        events={events}
        calendars={calendars}
        showTimeLabel={true}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        onEditEvent={onEditEvent}
      />

      {/* Time grid */}
      <TimeGrid
        dates={dates}
        events={events}
        calendars={calendars}
        onCreateEvent={onCreateEvent}
        showDayHeaders={false}
        initialScrollTop={initialScrollTop}
        onScrollChange={onScrollChange}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        onEditEvent={onEditEvent}
      />
    </div>
  );
}
