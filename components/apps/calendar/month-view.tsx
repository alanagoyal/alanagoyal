"use client";

import { cn } from "@/lib/utils";
import {
  getMonthViewDays,
  formatDateHeader,
  getEventsForDay,
  isToday,
  isSameMonth,
  format,
} from "./utils";
import { CalendarEvent, Calendar } from "./types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent: (date: Date, startTime: string, endTime: string) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
  onDateClick,
}: MonthViewProps) {
  const days = getMonthViewDays(currentDate);
  const weeks: Date[][] = [];

  // Group days into weeks
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get calendar color by id
  const getCalendarColor = (calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  };

  // Handle double-click to create event
  const handleDoubleClick = (date: Date) => {
    onCreateEvent(date, "09:00", "10:00");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "month")}
        </h1>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(events, day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={cn(
                    "border-b border-r border-border p-1 min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors",
                    !isCurrentMonth && "bg-muted/20"
                  )}
                  onDoubleClick={() => handleDoubleClick(day)}
                  onClick={() => onDateClick?.(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center",
                        !isCurrentMonth && "text-muted-foreground",
                        dayIsToday &&
                          "bg-red-500 text-white rounded-full"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => {
                      const color = getCalendarColor(event.calendarId);
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isStart = event.startDate === dateStr;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs px-1 py-0.5 truncate cursor-default flex items-center gap-1",
                            event.isAllDay
                              ? "text-white rounded"
                              : "text-foreground"
                          )}
                          style={
                            event.isAllDay
                              ? { backgroundColor: color }
                              : undefined
                          }
                        >
                          {!event.isAllDay && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                          )}
                          {event.isAllDay && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
                            />
                          )}
                          {(isStart || !event.isAllDay) && (
                            <span className="truncate">
                              {!event.isAllDay && event.startTime && (
                                <span className="text-muted-foreground mr-1">
                                  {event.startTime}
                                </span>
                              )}
                              {event.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
