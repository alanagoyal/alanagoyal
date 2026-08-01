"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
  onEditEvent?: (eventId: string) => void;
  onViewEvent?: (event: CalendarEvent) => void;
  isMobile?: boolean;
  onNavigate?: (direction: "prev" | "next") => void;
  onToday?: () => void;
  onNewEvent?: () => void;
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
  onEditEvent,
  onViewEvent,
  isMobile = false,
  onNavigate,
  onToday,
  onNewEvent,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col h-full">
      {/* Month/Year header */}
      <div className="relative px-4 py-3 border-b border-border bg-background flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "week")}
        </h1>

        {/* Navigation controls (shown on mobile) */}
        {isMobile && onNavigate && onToday && (
          <div className="flex items-center gap-1 pr-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("prev")}
              aria-label="Previous Week"
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
              aria-label="Next Week"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {onNewEvent && (
              <button
                type="button"
                onClick={onNewEvent}
                aria-label="New Event"
                title="New Event"
                className="absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-[#FF3B30] active:bg-muted/60"
                style={{
                  right: "max(0px, calc((100% - 4rem) / 14 - 1.375rem))",
                }}
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Day headers - fixed position */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="w-16 shrink-0" /> {/* Time label spacer */}
        {weekDays.map((date) => (
          <div
            key={date.toISOString()}
            className="flex-1 text-center py-2 border-l border-border first:border-l-0"
          >
            <div className="text-xs text-muted-foreground">
              {format(date, "EEE")}
            </div>
            {isToday(date) ? (
              <div className="w-8 h-8 bg-red-500 rounded-full mx-auto flex items-center justify-center">
                <span className="text-white text-lg font-medium pr-px">{format(date, "d")}</span>
              </div>
            ) : (
              <div className="text-lg font-medium">
                {format(date, "d")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* All-day events - fixed position, below day headers */}
      <AllDayRow
        dates={weekDays}
        events={events}
        calendars={calendars}
        showTimeLabel={true}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        onEditEvent={onEditEvent}
        onViewEvent={onViewEvent}
        editOnClick
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
        onEditEvent={onEditEvent}
        onViewEvent={onViewEvent}
        editOnClick
      />
    </div>
  );
}
