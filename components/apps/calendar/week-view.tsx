"use client";

import { cn } from "@/lib/utils";
import { getWeekDays, formatDateHeader, isToday, format } from "./utils";
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

      {/* Day headers - fixed position */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="w-16 shrink-0" /> {/* Time label spacer */}
        {weekDays.map((date, idx) => (
          <div
            key={idx}
            className="flex-1 text-center py-2 border-l border-border first:border-l-0"
          >
            <div className="text-xs text-muted-foreground">
              {format(date, "EEE")}
            </div>
            <div
              className={cn(
                "text-lg font-medium",
                isToday(date) &&
                  "bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto"
              )}
            >
              {format(date, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events - fixed position, below day headers */}
      <AllDayRow
        dates={weekDays}
        events={events}
        calendars={calendars}
        showTimeLabel={true}
      />

      {/* Time grid - scrollable, no day headers */}
      <TimeGrid
        dates={weekDays}
        events={events}
        calendars={calendars}
        onCreateEvent={onCreateEvent}
        showDayHeaders={false}
      />
    </div>
  );
}
