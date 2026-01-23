"use client";

import { cn } from "@/lib/utils";
import { getEventsForDay, format } from "./utils";
import { CalendarEvent, Calendar } from "./types";

interface AllDayRowProps {
  dates: Date[];
  events: CalendarEvent[];
  calendars: Calendar[];
  showTimeLabel?: boolean;
}

export function AllDayRow({
  dates,
  events,
  calendars,
  showTimeLabel = true,
}: AllDayRowProps) {
  // Get calendar color by id
  const getCalendarColor = (calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  };

  // Get all-day events for each date
  const allDayEventsByDate = dates.map((date) =>
    getEventsForDay(events, date).filter((e) => e.isAllDay)
  );

  // Check if there are any all-day events
  const hasAllDayEvents = allDayEventsByDate.some((events) => events.length > 0);

  if (!hasAllDayEvents) {
    return null;
  }

  return (
    <div className="flex border-b border-border bg-background">
      {/* Time label */}
      {showTimeLabel && (
        <div className="w-16 shrink-0 text-xs text-muted-foreground py-1 pr-2 text-right">
          all-day
        </div>
      )}

      {/* Event columns */}
      {dates.map((date, idx) => {
        const dayEvents = allDayEventsByDate[idx];

        return (
          <div
            key={idx}
            className="flex-1 py-1 px-0.5 border-l border-border first:border-l-0 min-h-[28px]"
          >
            {dayEvents.map((event) => {
              const color = getCalendarColor(event.calendarId);
              const dateStr = format(date, "yyyy-MM-dd");
              const isStart = event.startDate === dateStr;
              const isEnd = event.endDate === dateStr;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs text-white px-1.5 py-0.5 truncate cursor-default flex items-center gap-1",
                    isStart && isEnd && "rounded",
                    isStart && !isEnd && "rounded-l",
                    !isStart && isEnd && "rounded-r",
                    !isStart && !isEnd && "rounded-none"
                  )}
                  style={{ backgroundColor: color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
                  />
                  {isStart && <span className="truncate">{event.title}</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
