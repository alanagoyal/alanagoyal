"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "./utils";
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
  const [startDate, setStartDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(initialStartTime || "09:00");
  const [endTime, setEndTime] = useState(initialEndTime || "10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState(
    calendars.find((c) => c.id !== "holidays")?.id || calendars[0]?.id || "holidays"
  );

  // Reset form when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setTitle("");
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
    if (!title.trim()) return;

    const event: CalendarEvent = {
      id: generateEventId(),
      title: title.trim(),
      startDate,
      endDate: isAllDay ? endDate : startDate,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      calendarId,
    };

    onSave(event);
    onOpenChange(false);
  };

  // Filter out holidays calendar for event creation
  const editableCalendars = calendars.filter((c) => c.id !== "holidays");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={container} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>

          {/* All-day toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day">All-day</Label>
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* Start date/time */}
          <div className="grid gap-2">
            <Label>Starts</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!isAllDay && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="flex-1"
              />
              {!isAllDay && (
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
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

          {/* End date/time */}
          <div className="grid gap-2">
            <Label>Ends</Label>
            <div className="flex gap-2">
              {isAllDay ? (
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="flex-1"
                />
              ) : (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    disabled
                    className="flex-1 opacity-50"
                  />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
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

          {/* Calendar selection (only if there are non-holiday calendars) */}
          {editableCalendars.length > 0 && (
            <div className="grid gap-2">
              <Label>Calendar</Label>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
              >
                {editableCalendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
