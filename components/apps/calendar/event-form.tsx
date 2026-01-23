"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, parseISO } from "./utils";
import { CalendarEvent, Calendar } from "./types";
import { generateEventId } from "./data";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: CalendarEvent) => void;
  calendars: Calendar[];
  initialDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  container?: HTMLElement | null;
}

// Generate time options in 15-minute increments
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      options.push(`${h}:${m}`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

// Format time for display (12-hour format)
function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

// Format date for display
function formatDateDisplay(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "MMM d, yyyy");
}

export function EventForm({
  open,
  onOpenChange,
  onSave,
  calendars,
  initialDate,
  initialStartTime,
  initialEndTime,
  container,
}: EventFormProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(initialStartTime || "09:00");
  const [endTime, setEndTime] = useState(initialEndTime || "10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [calendarId, setCalendarId] = useState(
    calendars.find((c) => c.id !== "holidays")?.id || calendars[0]?.id || "holidays"
  );

  // Reset form when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setTitle("");
      setLocation("");
      setShowLocationInput(false);
      setStartDate(
        initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      );
      setEndDate(
        initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      );
      setStartTime(initialStartTime || "09:00");
      setEndTime(initialEndTime || "10:00");
      setIsAllDay(false);
      setCalendarId(
        calendars.find((c) => c.id !== "holidays")?.id || calendars[0]?.id || "holidays"
      );
    }
  }, [open, initialDate, initialStartTime, initialEndTime, calendars]);

  const handleSave = () => {
    const eventTitle = title.trim() || "New Event";

    const event: CalendarEvent = {
      id: generateEventId(),
      title: eventTitle,
      startDate,
      endDate: isAllDay ? endDate : startDate,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      calendarId,
      location: location.trim() || undefined,
    };

    onSave(event);
    onOpenChange(false);
  };

  // Get calendar color
  const selectedCalendar = calendars.find((c) => c.id === calendarId);
  const calendarColor = selectedCalendar?.color || "#FF3B30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container}
        className="sm:max-w-[320px] p-0 gap-0 overflow-hidden [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Create New Event</DialogTitle>
        {/* Title input - inline style */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New Event"
              className="flex-1 text-lg font-medium bg-transparent border-none outline-none placeholder:text-foreground"
              autoFocus
            />
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: calendarColor }}
            />
          </div>
        </div>

        {/* Location */}
        <div className="px-4 py-2 border-t border-border/50">
          {showLocationInput ? (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add Location"
                className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowLocationInput(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          )}
        </div>

        {/* Date/Time section */}
        <div className="px-4 py-3 border-t border-border/50 space-y-3">
          {/* All-day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm">All-day</span>
            <Switch
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* Start */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Starts</div>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                  "focus:outline-none focus:ring-2 focus:ring-ring"
                )}
              />
              {!isAllDay && (
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {formatTimeDisplay(time)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* End */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Ends</div>
            <div className="flex gap-2">
              {isAllDay ? (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                />
              ) : (
                <>
                  <input
                    type="date"
                    value={startDate}
                    disabled
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 opacity-50"
                    )}
                  />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                  >
                    {TIME_OPTIONS.filter((time) => time > startTime).map(
                      (time) => (
                        <option key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </option>
                      )
                    )}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border/50 bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-muted hover:bg-muted/80 text-foreground"
          >
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
