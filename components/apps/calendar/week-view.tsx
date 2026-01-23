"use client";

import { getWeekDays, formatDateHeader } from "./utils";
import { TimeGrid } from "./time-grid";
import { AllDayRow } from "./all-day-row";
import { CalendarEvent, Calendar } from "./types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent: (date: Date, startTime: string, endTime: string) => void;
}

export function WeekView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "week")}
        </h1>
      </div>

      {/* All-day events */}
      <AllDayRow
        dates={weekDays}
        events={events}
        calendars={calendars}
        showTimeLabel={true}
      />

      {/* Time grid with day headers */}
      <TimeGrid
        dates={weekDays}
        events={events}
        calendars={calendars}
        onCreateEvent={onCreateEvent}
        showDayHeaders={true}
      />
    </div>
  );
}
