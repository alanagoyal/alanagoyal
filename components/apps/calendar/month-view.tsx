"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  addWeeks,
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

// Virtual scrolling configuration
const WEEK_HEIGHT = 100; // Height of each week row in pixels
const TOTAL_WEEKS = 1040; // 10 years each direction (520 weeks × 2)
const CENTER_WEEK_INDEX = TOTAL_WEEKS / 2; // Index of "today's" week
const OVERSCAN = 5; // Extra weeks to render above/below viewport

// Base date for calculating week positions (far in the past)
function getBaseDate(): Date {
  const today = new Date();
  return startOfWeek(addWeeks(today, -CENTER_WEEK_INDEX));
}

// Get the week data for a given index
function getWeekForIndex(baseDate: Date, index: number): Date[] {
  const weekStart = addWeeks(baseDate, index);
  const weekEnd = endOfWeek(weekStart);
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

export function MonthView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
  onDateClick,
  onMonthChange,
}: MonthViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState(currentDate);
  const visibleMonthRef = useRef(visibleMonth);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const initialScrollDone = useRef(false);
  const lastCurrentDate = useRef(currentDate);

  // Keep ref in sync with state
  useEffect(() => {
    visibleMonthRef.current = visibleMonth;
  }, [visibleMonth]);

  // Base date for all week calculations
  const baseDate = useMemo(() => getBaseDate(), []);

  // Total scrollable height
  const totalHeight = TOTAL_WEEKS * WEEK_HEIGHT;

  // Calculate which weeks to render based on scroll position
  const { visibleWeeks } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / WEEK_HEIGHT) - OVERSCAN);
    const end = Math.min(
      TOTAL_WEEKS - 1,
      Math.ceil((scrollTop + viewportHeight) / WEEK_HEIGHT) + OVERSCAN
    );

    const weeks: { index: number; days: Date[] }[] = [];
    for (let i = start; i <= end; i++) {
      weeks.push({
        index: i,
        days: getWeekForIndex(baseDate, i),
      });
    }

    return { visibleWeeks: weeks };
  }, [scrollTop, viewportHeight, baseDate]);

  // Get calendar color by id
  const getCalendarColor = useCallback((calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  }, [calendars]);

  // Handle double-click to create event
  const handleDoubleClick = useCallback((date: Date) => {
    onCreateEvent(date, "09:00", "10:00");
  }, [onCreateEvent]);

  // Initialize viewport height
  useEffect(() => {
    if (scrollRef.current) {
      setViewportHeight(scrollRef.current.clientHeight);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(scrollRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Scroll to current date on initial render or when currentDate changes
  useEffect(() => {
    const dateChanged = lastCurrentDate.current.getTime() !== currentDate.getTime();

    // Wait for viewportHeight to be measured before scrolling
    if (scrollRef.current && viewportHeight > 0 && (!initialScrollDone.current || dateChanged)) {
      // Calculate which week index contains the current date
      const weeksDiff = Math.floor(
        (startOfWeek(currentDate).getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const targetIndex = Math.max(0, Math.min(TOTAL_WEEKS - 1, weeksDiff));

      // Scroll to center that week in the viewport
      const targetScrollTop = targetIndex * WEEK_HEIGHT - viewportHeight / 2 + WEEK_HEIGHT / 2;
      scrollRef.current.scrollTop = Math.max(0, targetScrollTop);

      initialScrollDone.current = true;
      lastCurrentDate.current = currentDate;

      if (dateChanged) {
        setVisibleMonth(currentDate);
        onMonthChange?.(currentDate);
      }
    }
  }, [currentDate, baseDate, viewportHeight, onMonthChange]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const newScrollTop = scrollRef.current.scrollTop;
    setScrollTop(newScrollTop);

    // Determine visible month based on scroll position
    const centerIndex = Math.floor((newScrollTop + viewportHeight / 3) / WEEK_HEIGHT);
    const centerWeek = getWeekForIndex(baseDate, centerIndex);

    if (centerWeek.length > 0) {
      // Find dominant month in this week
      const monthCounts = new Map<number, number>();
      centerWeek.forEach(day => {
        const month = getMonth(day);
        monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
      });

      let dominantMonth = getMonth(centerWeek[0]);
      let maxCount = 0;
      monthCounts.forEach((count, month) => {
        if (count > maxCount) {
          maxCount = count;
          dominantMonth = month;
        }
      });

      const monthDate = centerWeek.find(d => getMonth(d) === dominantMonth) || centerWeek[0];
      const newMonth = startOfMonth(monthDate);

      // Use ref to avoid recreating callback when visibleMonth changes
      if (format(newMonth, "yyyy-MM") !== format(visibleMonthRef.current, "yyyy-MM")) {
        setVisibleMonth(newMonth);
        onMonthChange?.(newMonth);
      }
    }
  }, [baseDate, viewportHeight, onMonthChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header */}
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

      {/* Virtualized scrollable weeks container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Spacer div to create total scrollable height */}
        <div style={{ height: totalHeight, position: "relative" }}>
          {/* Only render visible weeks */}
          {visibleWeeks.map(({ index, days }) => (
            <div
              key={index}
              className="grid grid-cols-7 absolute left-0 right-0"
              style={{
                top: index * WEEK_HEIGHT,
                height: WEEK_HEIGHT,
              }}
            >
              {days.map((day, dayIdx) => {
                const dayEvents = getEventsForDay(events, day);
                const dayIsToday = isToday(day);
                const isFirstOfMonth = day.getDate() === 1;
                const monthOfDay = getMonth(day);
                const isCurrentViewMonth = monthOfDay === getMonth(visibleMonth);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      "border-b border-r border-border p-1 cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden"
                    )}
                    style={{ height: WEEK_HEIGHT }}
                    onDoubleClick={() => handleDoubleClick(day)}
                    onClick={() => onDateClick?.(day)}
                  >
                    {/* Day number */}
                    <div className="flex justify-end mb-1">
                      {isFirstOfMonth ? (
                        <span
                          className={cn(
                            "text-sm flex items-center gap-1",
                            dayIsToday ? "font-medium" : "text-muted-foreground"
                          )}
                        >
                          <span className={cn(
                            dayIsToday && "bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          )}>
                            {dayIsToday ? <span className="pr-px">{format(day, "d")}</span> : null}
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
                          <span className={cn(dayIsToday && "pr-px")}>{format(day, "d")}</span>
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
    </div>
  );
}
