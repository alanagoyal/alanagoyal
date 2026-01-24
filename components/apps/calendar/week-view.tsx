"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getWeekDays, formatDateHeader, isToday, format } from "./utils";
import { TimeGrid } from "./time-grid";
import { AllDayRow } from "./all-day-row";
import { CalendarEvent, Calendar } from "./types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  onCreateEvent?: (date: Date, startTime: string, endTime: string) => void;
  initialScrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string | null) => void;
  isMobile?: boolean;
  onNavigate?: (direction: "prev" | "next") => void;
  onToday?: () => void;
}

export function WeekView({
  currentDate,
  events,
  calendars,
  onCreateEvent,
  initialScrollTop,
  onScrollChange,
  selectedEventId,
  onSelectEvent,
  isMobile = false,
  onNavigate,
  onToday,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header */}
      <div className="px-4 py-3 border-b border-border bg-background flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "week")}
        </h1>

        {/* Navigation controls (shown on mobile) */}
        {isMobile && onNavigate && onToday && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("prev")}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              className="h-8 px-2 text-xs"
            >
              Today
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("next")}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
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
        initialScrollTop={initialScrollTop}
        onScrollChange={onScrollChange}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
