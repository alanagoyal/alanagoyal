"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  getDayHours,
  formatHour,
  getEventsForDay,
  getEventTimePosition,
  pixelToTime,
  formatTimeValue,
  formatEventTime,
  isToday,
  format,
} from "./utils";
import { CalendarEvent, Calendar } from "./types";

// Calculate layout for overlapping events
interface EventLayout {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
}

function calculateEventLayout(events: CalendarEvent[]): EventLayout[] {
  if (events.length === 0) return [];

  // Parse time to minutes for easier comparison
  const parseTime = (time: string): number => {
    const [hour, min] = time.split(":").map(Number);
    return hour * 60 + min;
  };

  // Pre-calculate start/end times for all events
  const eventTimes = new Map<string, { start: number; end: number }>();
  for (const event of events) {
    eventTimes.set(event.id, {
      start: parseTime(event.startTime || "00:00"),
      end: parseTime(event.endTime || "23:59"),
    });
  }

  // Sort events by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const aTime = eventTimes.get(a.id)!;
    const bTime = eventTimes.get(b.id)!;
    if (aTime.start !== bTime.start) return aTime.start - bTime.start;
    return (bTime.end - bTime.start) - (aTime.end - aTime.start);
  });

  // Track columns: each column has the end time and events in it
  const columns: { endTime: number; events: CalendarEvent[] }[] = [];
  const eventColumns: Map<string, number> = new Map();

  for (const event of sorted) {
    const { start, end } = eventTimes.get(event.id)!;

    // Find first column where this event fits (no overlap)
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      if (columns[col].endTime <= start) {
        columns[col].endTime = end;
        columns[col].events.push(event);
        eventColumns.set(event.id, col);
        placed = true;
        break;
      }
    }

    // If no column fits, create a new one
    if (!placed) {
      eventColumns.set(event.id, columns.length);
      columns.push({ endTime: end, events: [event] });
    }
  }

  // Build overlap groups using union-find for O(n) grouping
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id);
    if (parent.get(id) !== id) {
      parent.set(id, find(parent.get(id)!));
    }
    return parent.get(id)!;
  };
  const union = (a: string, b: string) => {
    parent.set(find(a), find(b));
  };

  // Union events that overlap (only check adjacent columns)
  for (let col = 0; col < columns.length - 1; col++) {
    for (const event of columns[col].events) {
      const { start, end } = eventTimes.get(event.id)!;
      for (const other of columns[col + 1].events) {
        const otherTime = eventTimes.get(other.id)!;
        if (start < otherTime.end && end > otherTime.start) {
          union(event.id, other.id);
        }
      }
    }
  }

  // Calculate max column for each overlap group
  const groupMaxColumn = new Map<string, number>();
  for (const event of events) {
    const group = find(event.id);
    const col = eventColumns.get(event.id) || 0;
    groupMaxColumn.set(group, Math.max(groupMaxColumn.get(group) || 0, col));
  }

  // Build result
  return events.map((event) => ({
    event,
    column: eventColumns.get(event.id) || 0,
    totalColumns: (groupMaxColumn.get(find(event.id)) || 0) + 1,
  }));
}

interface TimeGridProps {
  dates: Date[];
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent?: (date: Date, startTime: string, endTime: string) => void;
  hourHeight?: number;
  showDayHeaders?: boolean;
  initialScrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string | null) => void;
  onEditEvent?: (eventId: string) => void;
}

export function TimeGrid({
  dates,
  events,
  calendars,
  onCreateEvent,
  hourHeight = 60,
  showDayHeaders = false,
  initialScrollTop,
  onScrollChange,
  selectedEventId,
  onSelectEvent,
  onEditEvent,
}: TimeGridProps) {
  const hours = getDayHours();
  const gridRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const [dragState, setDragState] = useState<{
    columnIndex: number;
    startY: number;
    currentY: number;
  } | null>(null);

  // Restore scroll position on mount
  useEffect(() => {
    if (gridRef.current && initialScrollTop !== undefined && !hasRestoredScroll.current) {
      gridRef.current.scrollTop = initialScrollTop;
      hasRestoredScroll.current = true;
    }
  }, [initialScrollTop]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (gridRef.current && onScrollChange) {
      onScrollChange(gridRef.current.scrollTop);
    }
  }, [onScrollChange]);

  // Get calendar color by id
  const getCalendarColor = (calendarId: string): string => {
    const calendar = calendars.find((c) => c.id === calendarId);
    return calendar?.color || "#007AFF";
  };

  // Top padding offset for time grid
  const gridPaddingTop = 8;

  // Maximum Y position (24 hours worth of pixels)
  const maxGridY = 24 * hourHeight;

  // Clamp Y position to valid grid bounds [0, maxGridY]
  const clampY = useCallback((y: number) => Math.max(0, Math.min(maxGridY, y)), [maxGridY]);

  // Handle mouse down on time grid for drag creation (disabled if onCreateEvent not provided)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnIndex: number) => {
      if (!onCreateEvent) return;

      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect) return;

      const rawY = e.clientY - gridRect.top + (gridRef.current?.scrollTop || 0) - gridPaddingTop;
      const relativeY = clampY(rawY);

      setDragState({
        columnIndex,
        startY: relativeY,
        currentY: relativeY,
      });
    },
    [onCreateEvent, clampY]
  );

  // Handle mouse move during drag
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect) return;

      const rawY = e.clientY - gridRect.top + (gridRef.current?.scrollTop || 0) - gridPaddingTop;
      const relativeY = clampY(rawY);
      setDragState((prev) => (prev ? { ...prev, currentY: relativeY } : null));
    };

    const handleMouseUp = () => {
      if (dragState) {
        const minY = Math.min(dragState.startY, dragState.currentY);
        const maxY = Math.max(dragState.startY, dragState.currentY);

        const startTime = pixelToTime(minY, hourHeight);
        let endTime = pixelToTime(maxY, hourHeight);

        // Ensure minimum 15 min duration
        const startMinutes = startTime.hour * 60 + startTime.minute;
        const endMinutes = endTime.hour * 60 + endTime.minute;
        if (endMinutes <= startMinutes) {
          const newEndMinutes = Math.min(startMinutes + 15, 24 * 60);
          endTime = {
            hour: Math.floor(newEndMinutes / 60),
            minute: newEndMinutes % 60,
          };
        }

        const date = dates[dragState.columnIndex];
        onCreateEvent?.(
          date,
          formatTimeValue(startTime.hour, startTime.minute),
          formatTimeValue(endTime.hour, endTime.minute)
        );
      }
      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, dates, onCreateEvent, hourHeight, clampY]);

  // Handle double-click to create event (disabled if onCreateEvent not provided)
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, columnIndex: number) => {
      if (!onCreateEvent) return;

      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect) return;

      const rawY = e.clientY - gridRect.top + (gridRef.current?.scrollTop || 0) - gridPaddingTop;
      const relativeY = clampY(rawY);
      const time = pixelToTime(relativeY, hourHeight);

      // For start time, clamp to 23:00 max (can't start at midnight)
      const startHour = Math.min(23, time.hour);
      const startMinute = time.hour >= 24 ? 0 : time.minute;

      const endMinutes = Math.min(startHour * 60 + startMinute + 60, 24 * 60); // Default 1 hour, capped at midnight
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;

      const date = dates[columnIndex];
      onCreateEvent(
        date,
        formatTimeValue(startHour, startMinute),
        formatTimeValue(endHour, endMin)
      );
    },
    [dates, onCreateEvent, hourHeight, clampY]
  );

  // Calculate current time indicator position
  const now = new Date();
  const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) * (hourHeight / 60);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers for week view */}
      {showDayHeaders && (
        <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
          <div className="w-16 shrink-0" /> {/* Time label spacer */}
          {dates.map((date) => (
            <div
              key={date.toISOString()}
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
      )}

      {/* Scrollable time grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto relative" onScroll={handleScroll}>
        <div className="flex relative" style={{ minHeight: hourHeight * 24 + gridPaddingTop * 2 }}>
          {/* Time labels */}
          <div className="w-16 shrink-0 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-xs text-muted-foreground -translate-y-1/2"
                style={{ top: hour * hourHeight + gridPaddingTop }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Grid columns */}
          {dates.map((date, columnIndex) => {
            const dayEvents = getEventsForDay(events, date).filter(
              (e) => !e.isAllDay
            );
            const eventLayouts = calculateEventLayout(dayEvents);

            return (
              <div
                key={columnIndex}
                className="flex-1 relative border-l border-border first:border-l-0"
                onMouseDown={(e) => {
                  // If there's a selected event, just deselect it (don't start drag)
                  if (selectedEventId) {
                    onSelectEvent?.(null);
                    return;
                  }
                  handleMouseDown(e, columnIndex);
                }}
                onDoubleClick={(e) => handleDoubleClick(e, columnIndex)}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: hour * hourHeight + gridPaddingTop }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(date) && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: currentTimeTop + gridPaddingTop }}
                  >
                    <div className="relative">
                      <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 -top-[3px]" />
                      <div className="h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {eventLayouts.map(({ event, column, totalColumns }) => {
                  const { top, height } = getEventTimePosition(event);
                  const color = getCalendarColor(event.calendarId);
                  const timeRange = event.startTime && event.endTime
                    ? `${formatEventTime(event.startTime)} – ${formatEventTime(event.endTime)}`
                    : null;

                  // Calculate width and left position for overlapping events
                  const width = `calc((100% - 8px) / ${totalColumns})`;
                  const left = `calc(4px + (100% - 8px) * ${column} / ${totalColumns})`;

                  const isSelected = selectedEventId === event.id;
                  // Check if this is a user event (can be deleted)
                  const isUserEvent = events.some((e) => e.id === event.id);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute rounded px-1.5 py-0.5 text-xs overflow-hidden border-l-2",
                        isUserEvent ? "cursor-pointer" : "cursor-default"
                      )}
                      style={{
                        top: top + gridPaddingTop,
                        height,
                        width,
                        left,
                        backgroundColor: isSelected ? `${color}50` : `${color}20`,
                        color: color,
                        borderLeftColor: color,
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
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {timeRange && height > 30 && (
                        <div className="truncate opacity-75">{timeRange}</div>
                      )}
                      {event.location && height > 45 && (
                        <div className="truncate opacity-75">{event.location}</div>
                      )}
                    </div>
                  );
                })}

                {/* Drag selection preview */}
                {dragState && dragState.columnIndex === columnIndex && (
                  <div
                    className="absolute left-1 right-1 bg-blue-500/30 border border-blue-500 rounded pointer-events-none"
                    style={{
                      top: Math.min(dragState.startY, dragState.currentY) + gridPaddingTop,
                      height: Math.abs(dragState.currentY - dragState.startY),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
