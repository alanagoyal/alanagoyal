"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import { format, parseISO } from "./utils";
import { CalendarEvent, Calendar } from "./types";
import { generateEventId } from "./data";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: CalendarEvent) => void;
  calendars: Calendar[];
  initialDate?: Date;
  initialEndDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  container?: HTMLElement | null;
  eventToEdit?: CalendarEvent | null;
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
// End time options include 24:00 (midnight/end of day)
const END_TIME_OPTIONS = [...TIME_OPTIONS, "24:00"];

// Format time for display (12-hour format)
function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  // Handle 24:00 as midnight (end of day)
  const displayHour = hour === 24 ? 0 : hour;
  const h = displayHour % 12 || 12;
  const ampm = displayHour < 12 ? "AM" : "PM";
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
  initialEndDate,
  initialStartTime,
  initialEndTime,
  container,
  eventToEdit,
}: EventFormProps) {
  const isEditing = !!eventToEdit;
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    (initialEndDate || initialDate) ? format(initialEndDate || initialDate!, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(initialStartTime || "09:00");
  const [endTime, setEndTime] = useState(initialEndTime || "10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);
  const [calendarId, setCalendarId] = useState(
    calendars.find((c) => c.id === "meetings")?.id ||
    calendars.find((c) => c.id !== "holidays")?.id ||
    calendars[0]?.id || "meetings"
  );

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(e.target as Node)) {
        setShowCalendarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when dialog opens with new initial values or event to edit
  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        // Editing existing event - pre-populate form
        setTitle(eventToEdit.title);
        setLocation(eventToEdit.location || "");
        setShowLocationInput(!!eventToEdit.location);
        setShowCalendarDropdown(false);
        setStartDate(eventToEdit.startDate);
        setEndDate(eventToEdit.endDate);
        setStartTime(eventToEdit.startTime || "09:00");
        setEndTime(eventToEdit.endTime || "10:00");
        setIsAllDay(eventToEdit.isAllDay);
        setCalendarId(eventToEdit.calendarId);
      } else {
        // Creating new event
        setTitle("");
        setLocation("");
        setShowLocationInput(false);
        setShowCalendarDropdown(false);
        setStartDate(
          initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
        );
        setEndDate(
          (initialEndDate || initialDate) ? format(initialEndDate || initialDate!, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
        );
        setStartTime(initialStartTime || "09:00");
        setEndTime(initialEndTime || "10:00");
        setIsAllDay(false);
        setCalendarId(
          calendars.find((c) => c.id === "meetings")?.id ||
          calendars.find((c) => c.id !== "holidays")?.id ||
          calendars[0]?.id || "meetings"
        );
      }
    }
  }, [open, initialDate, initialEndDate, initialStartTime, initialEndTime, calendars, eventToEdit]);

  const handleSave = () => {
    const eventTitle = title.trim() || "New Event";

    // For timed events ending at 24:00, keep the time as 24:00 for correct rendering
    // but set endDate to startDate (24:00 means end of the start day, not next day)
    const eventEndDate = (!isAllDay && endTime === "24:00") ? startDate : endDate;

    const event: CalendarEvent = {
      id: eventToEdit?.id || generateEventId(),
      title: eventTitle,
      startDate,
      endDate: eventEndDate,
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
        <DialogTitle className="sr-only">{isEditing ? "Edit Event" : "Create New Event"}</DialogTitle>
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
            {/* Calendar color dropdown */}
            <div className="relative" ref={calendarDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                className="flex items-center gap-1 p-1 rounded hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: calendarColor }}
                />
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              {showCalendarDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                  {[...calendars.filter(c => c.id !== "holidays"), ...calendars.filter(c => c.id === "holidays")].map((calendar) => (
                    <button
                      key={calendar.id}
                      type="button"
                      onClick={() => {
                        setCalendarId(calendar.id);
                        setShowCalendarDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors",
                        calendarId === calendar.id && "bg-muted/30"
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span>{calendar.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  onChange={(e) => {
                    const newStartTime = e.target.value;

                    // Calculate current duration in minutes
                    const [oldStartH, oldStartM] = startTime.split(":").map(Number);
                    const [oldEndH, oldEndM] = endTime.split(":").map(Number);
                    const durationMinutes = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);

                    // Calculate new end time preserving duration
                    const [newStartH, newStartM] = newStartTime.split(":").map(Number);
                    const newEndMinutes = newStartH * 60 + newStartM + durationMinutes;
                    let newEndH = Math.floor(newEndMinutes / 60);
                    let newEndM = newEndMinutes % 60;

                    // Clamp to end of day (24:00 max)
                    if (newEndH > 24 || (newEndH === 24 && newEndM > 0)) {
                      newEndH = 24;
                      newEndM = 0;
                    }

                    const newEndTime = `${newEndH.toString().padStart(2, "0")}:${newEndM.toString().padStart(2, "0")}`;

                    setStartTime(newStartTime);
                    setEndTime(newEndTime);
                  }}
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
                    value={endTime === "24:00" ? format(addDays(parseISO(startDate), 1), "yyyy-MM-dd") : endDate}
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
                    {END_TIME_OPTIONS.filter((time) => time > startTime).map(
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
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-muted hover:bg-muted/80 text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
          >
            {isEditing ? "Save" : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
