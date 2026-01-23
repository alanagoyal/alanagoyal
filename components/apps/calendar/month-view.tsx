"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  getMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  getEventsForDay,
  isToday,
  format,
  formatEventTime,
} from "./utils";
import { CalendarEvent, Calendar } from "./types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent: (date: Date, startTime: string, endTime: string) => void;
  onDateClick?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Number of weeks to render before and after current week
const WEEKS_BUFFER = 52; // About 1 year each direction

export function MonthView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
  onDateClick,
  onMonthChange,
}: MonthViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [visibleMonth, setVisibleMonth] = useState(currentDate);
  const initialScrollDone = useRef(false);
  const lastCurrentDate = useRef(currentDate);

  // Generate continuous weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    const startWeek = startOfWeek(subWeeks(currentDate, WEEKS_BUFFER));

    for (let i = 0; i < WEEKS_BUFFER * 2 + 1; i++) {
      const weekStart = addWeeks(startWeek, i);
      const weekEnd = endOfWeek(weekStart);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      result.push(days);
    }

    return result;
  }, [currentDate]);

  // Find the index of the current week
  const currentWeekIndex = WEEKS_BUFFER;

  // Get calendar color by id
  const getCalendarColor = useCallback((calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  }, [calendars]);

  // Handle double-click to create event
  const handleDoubleClick = useCallback((date: Date) => {
    onCreateEvent(date, "09:00", "10:00");
  }, [onCreateEvent]);

  // Scroll to current week on initial render or when currentDate changes externally (e.g., Today button)
  useEffect(() => {
    const dateChanged = lastCurrentDate.current.getTime() !== currentDate.getTime();

    if (!initialScrollDone.current || dateChanged) {
      const weekEl = weekRefs.current.get(currentWeekIndex);
      if (weekEl && scrollRef.current) {
        // Scroll to center the current week in the viewport
        const containerHeight = scrollRef.current.clientHeight;
        const weekHeight = weekEl.clientHeight;
        const scrollTop = weekEl.offsetTop - (containerHeight / 2) + (weekHeight / 2);
        scrollRef.current.scrollTop = Math.max(0, scrollTop);
        initialScrollDone.current = true;
        lastCurrentDate.current = currentDate;

        // Also update visible month to match
        if (dateChanged) {
          setVisibleMonth(currentDate);
          onMonthChange?.(currentDate);
        }
      }
    }
  }, [currentWeekIndex, currentDate, onMonthChange]);

  // Track visible month on scroll
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const scrollTop = scrollEl.scrollTop;
      const viewportMiddle = scrollTop + scrollEl.clientHeight / 3;

      // Find the week that's at the viewport middle
      let closestWeekIdx = 0;
      let closestDistance = Infinity;

      weekRefs.current.forEach((el, idx) => {
        const weekMiddle = el.offsetTop + el.clientHeight / 2;
        const distance = Math.abs(weekMiddle - viewportMiddle);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestWeekIdx = idx;
        }
      });

      // Get the month of the first day of that week
      const week = weeks[closestWeekIdx];
      if (week) {
        // Find the most common month in this week (usually the one with more days)
        const monthCounts = new Map<number, number>();
        week.forEach(day => {
          const month = getMonth(day);
          monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
        });

        let dominantMonth = getMonth(week[0]);
        let maxCount = 0;
        monthCounts.forEach((count, month) => {
          if (count > maxCount) {
            maxCount = count;
            dominantMonth = month;
          }
        });

        const monthDate = week.find(d => getMonth(d) === dominantMonth) || week[0];
        const newMonth = startOfMonth(monthDate);

        if (format(newMonth, "yyyy-MM") !== format(visibleMonth, "yyyy-MM")) {
          setVisibleMonth(newMonth);
          onMonthChange?.(newMonth);
        }
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [weeks, visibleMonth, onMonthChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header - updates based on scroll position */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">
          {format(visibleMonth, "MMMM yyyy")}
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

      {/* Scrollable weeks container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            ref={(el) => {
              if (el) weekRefs.current.set(weekIdx, el);
            }}
            className="grid grid-cols-7"
          >
            {week.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(events, day);
              const dayIsToday = isToday(day);
              const isFirstOfMonth = day.getDate() === 1;
              const monthOfDay = getMonth(day);
              const isCurrentViewMonth = monthOfDay === getMonth(visibleMonth);

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "border-b border-r border-border p-1 min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors"
                  )}
                  onDoubleClick={() => handleDoubleClick(day)}
                  onClick={() => onDateClick?.(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    {isFirstOfMonth ? (
                      <span
                        className={cn(
                          "text-sm flex items-center gap-1",
                          dayIsToday
                            ? "font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <span className={cn(
                          dayIsToday && "bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        )}>
                          {dayIsToday ? format(day, "d") : null}
                        </span>
                        {!dayIsToday && (
                          <>
                            {format(day, "MMM")} {format(day, "d")}
                          </>
                        )}
                        {dayIsToday && (
                          <span className="text-muted-foreground">
                            {format(day, "MMM")}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-medium w-6 h-6 flex items-center justify-center",
                          !isCurrentViewMonth && "text-muted-foreground",
                          dayIsToday && "bg-red-500 text-white rounded-full"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    )}
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
                          className="text-xs px-1.5 py-0.5 truncate cursor-default flex items-center gap-1 rounded"
                          style={{
                            backgroundColor: `${color}20`,
                            color: color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          {(isStart || !event.isAllDay) && (
                            <span className="truncate font-medium">
                              {!event.isAllDay && event.startTime && (
                                <span className="opacity-75 mr-1">
                                  {formatEventTime(event.startTime)}
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
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
