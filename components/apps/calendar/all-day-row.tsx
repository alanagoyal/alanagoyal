"use client";

import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getEventsForDay, format } from "./utils";
import { CalendarEvent, Calendar } from "./types";

interface AllDayRowProps {
  dates: Date[];
  events: CalendarEvent[];
  calendars: Calendar[];
  showTimeLabel?: boolean;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string | null) => void;
  onEditEvent?: (eventId: string) => void;
}

export function AllDayRow({
  dates,
  events,
  calendars,
  showTimeLabel = true,
  selectedEventId,
  onSelectEvent,
  onEditEvent,
}: AllDayRowProps) {
  // Get calendar color by id
  const getCalendarColor = useCallback((calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  }, [calendars]);

  // Get all-day events for each date (memoized to prevent recalculation on every render)
  const allDayEventsByDate = useMemo(() =>
    dates.map((date) => getEventsForDay(events, date).filter((e) => e.isAllDay)),
    [dates, events]
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
            key={date.toISOString()}
            className="flex-1 py-1 px-0.5 border-l border-border first:border-l-0 min-h-[28px] overflow-hidden"
          >
            {dayEvents.map((event) => {
              const color = getCalendarColor(event.calendarId);
              const dateStr = format(date, "yyyy-MM-dd");
              const isStart = event.startDate === dateStr;
              const isEnd = event.endDate === dateStr;
              const isSelected = selectedEventId === event.id;
              // Check if this is a user event (can be selected/edited)
              const isUserEvent = events.some((e) => e.id === event.id);

              return (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs px-1.5 py-0.5 truncate flex items-center gap-1",
                    isStart && isEnd && "rounded",
                    isStart && !isEnd && "rounded-l",
                    !isStart && isEnd && "rounded-r",
                    !isStart && !isEnd && "rounded-none",
                    isUserEvent ? "cursor-pointer" : "cursor-default"
                  )}
                  style={{
                    backgroundColor: isSelected ? `${color}50` : `${color}20`,
                    color: color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isUserEvent) {
                      onSelectEvent?.(isSelected ? null : event.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (isUserEvent) {
                      onEditEvent?.(event.id);
                    }
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {isStart && <span className="truncate font-medium">{event.title}</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
