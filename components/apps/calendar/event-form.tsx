"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
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
  onDelete?: (eventId: string) => void;
  calendars: Calendar[];
  initialDate?: Date;
  initialEndDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  container?: HTMLElement | null;
  eventToEdit?: CalendarEvent | null;
  readOnly?: boolean;
  isMobile?: boolean;
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

function dateTimeFor(date: string, time: string): Date {
  if (time === "24:00") {
    return addDays(parseISO(date), 1);
  }
  return parseISO(`${date}T${time}:00`);
}

// Format time for display (12-hour format)
function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  // Handle 24:00 as midnight (end of day)
  const displayHour = hour === 24 ? 0 : hour;
  const h = displayHour % 12 || 12;
  const ampm = displayHour < 12 ? "AM" : "PM";
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export function EventForm({
  open,
  onOpenChange,
  onSave,
  onDelete,
  calendars,
  initialDate,
  initialEndDate,
  initialStartTime,
  initialEndTime,
  container,
  eventToEdit,
  readOnly = false,
  isMobile = false,
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
    if (readOnly) return;
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

  const handleDelete = () => {
    if (!eventToEdit || !onDelete) return;
    onDelete(eventToEdit.id);
    onOpenChange(false);
  };

  // Get calendar color
  const selectedCalendar = calendars.find((c) => c.id === calendarId);
  const calendarColor = selectedCalendar?.color || "#FF3B30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container}
        overlayClassName={isMobile ? "bg-black/20 backdrop-blur-[1px]" : undefined}
        className={cn(
          "p-0 gap-0 overflow-hidden [&>button]:hidden",
          isMobile
            ? "!left-0 !top-2 bottom-0 flex !h-[calc(100%-0.5rem)] !max-h-none !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col rounded-t-[32px] border-x-0 border-b-0 border-white/70 bg-[#F2F2F7] shadow-2xl dark:border-white/10 dark:bg-[#1C1C1E] data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8"
            : "desktop:max-w-[320px]"
        )}
        aria-describedby={undefined}
        data-calendar-event-form={isMobile ? "mobile-sheet" : "desktop-dialog"}
      >
        <DialogTitle className="sr-only">
          {readOnly ? "Event Details" : isEditing ? "Edit Event" : "Create New Event"}
        </DialogTitle>

        {isMobile && (
          <div className="relative flex h-[76px] shrink-0 items-center justify-between px-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Cancel"
              className="grid h-11 w-11 place-items-center rounded-full bg-background/90 shadow-sm active:scale-95 active:bg-background"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            <span className="absolute inset-x-16 text-center text-lg font-semibold">
              {readOnly ? "Event Details" : isEditing ? "Edit Event" : "New"}
            </span>
            {readOnly ? (
              <div className="h-11 w-11" aria-hidden="true" />
            ) : (
              <button
                type="button"
                onClick={handleSave}
                aria-label={isEditing ? "Save Event" : "Add Event"}
                className="grid h-11 w-11 place-items-center rounded-full bg-[#FF3B30] text-white shadow-sm active:scale-95 active:bg-[#D92D27]"
              >
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            isMobile &&
              "min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          )}
        >
          <div
            className={cn(
              isMobile &&
                "mt-2 rounded-[24px] bg-background shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
            )}
          >
            {/* Title input - inline style */}
            <div className={cn("px-4 pt-4 pb-2", isMobile && "pt-3 pb-3")}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  readOnly={readOnly}
                  placeholder={isMobile ? "Title" : "New Event"}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none",
                    isMobile
                      ? "min-w-0 text-xl font-normal placeholder:text-muted-foreground/55"
                      : "text-lg font-medium placeholder:text-foreground"
                  )}
                  autoFocus
                />
                {/* Calendar color dropdown */}
                <div className="relative" ref={calendarDropdownRef}>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="flex items-center gap-1 rounded p-1 transition-colors can-hover:hover:bg-muted/50"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: calendarColor }}
                    />
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {showCalendarDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                      {[
                        ...calendars.filter((c) => c.id !== "holidays"),
                        ...calendars.filter((c) => c.id === "holidays"),
                      ].map((calendar) => (
                        <button
                          key={calendar.id}
                          type="button"
                          disabled={readOnly}
                          onClick={() => {
                            setCalendarId(calendar.id);
                            setShowCalendarDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors can-hover:hover:bg-muted/50",
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
            <div className={cn("px-4 py-2 border-t border-border/50", isMobile && "py-3")}>
              <div className="flex items-center gap-2">
                {!isMobile && <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />}
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  readOnly={readOnly}
                  placeholder={isMobile ? "Location or Video Call" : "Add Location"}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground",
                    isMobile ? "text-lg" : "text-sm"
                  )}
                />
              </div>
            </div>
          </div>

        {/* Date/Time section */}
        <div className={cn(
          "px-4 py-3 border-t border-border/50 space-y-3",
          isMobile && "mt-5 space-y-0 rounded-[24px] border-0 bg-background py-0 shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
        )}>
          {/* All-day toggle */}
          <div className={cn("flex items-center justify-between", isMobile && "min-h-14")}>
            <span className={cn(isMobile ? "text-lg" : "text-sm")}>All-day</span>
            <Switch
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
              disabled={readOnly}
            />
          </div>

          {/* Start */}
          <div className={cn("space-y-1", isMobile && "flex min-h-14 items-center justify-between gap-3 space-y-0 border-t border-border/50")}>
            <div className={cn(isMobile ? "shrink-0 text-lg text-foreground" : "text-xs text-muted-foreground")}>Starts</div>
            <div className="flex min-w-0 gap-2">
              <input
                type="date"
                disabled={readOnly}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                  isMobile && "min-w-0 rounded-xl border-0 bg-muted px-2 py-1.5 text-base",
                  "focus:outline-none focus:ring-2 focus:ring-ring"
                )}
              />
              {!isAllDay && (
                <select
                  value={startTime}
                  disabled={readOnly}
                  onChange={(e) => {
                    const newStartTime = e.target.value;

                    const oldStart = dateTimeFor(startDate, startTime);
                    const oldEnd = dateTimeFor(endDate, endTime);
                    const durationMs = Math.max(
                      15 * 60 * 1000,
                      oldEnd.getTime() - oldStart.getTime()
                    );
                    const newStart = dateTimeFor(startDate, newStartTime);
                    const newEnd = new Date(newStart.getTime() + durationMs);

                    setStartTime(newStartTime);
                    setEndDate(format(newEnd, "yyyy-MM-dd"));
                    setEndTime(format(newEnd, "HH:mm"));
                  }}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                    isMobile && "min-w-0 rounded-xl border-0 bg-muted px-2 py-1.5 text-base",
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
          <div className={cn("space-y-1", isMobile && "flex min-h-14 items-center justify-between gap-3 space-y-0 border-t border-border/50")}>
            <div className={cn(isMobile ? "shrink-0 text-lg text-foreground" : "text-xs text-muted-foreground")}>Ends</div>
            <div className="flex min-w-0 gap-2">
              {isAllDay ? (
                <input
                  type="date"
                  disabled={readOnly}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                    isMobile && "min-w-0 rounded-xl border-0 bg-muted px-2 py-1.5 text-base",
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
                      "flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 opacity-50",
                      isMobile && "min-w-0 rounded-xl border-0 bg-muted px-2 py-1.5 text-base"
                    )}
                  />
                  <select
                    value={endTime}
                    disabled={readOnly}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg border border-border bg-muted/50",
                      isMobile && "min-w-0 rounded-xl border-0 bg-muted px-2 py-1.5 text-base",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                  >
                    {(endDate > startDate
                      ? TIME_OPTIONS
                      : END_TIME_OPTIONS.filter((time) => time > startTime)
                    ).map(
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

        {isMobile && isEditing && !readOnly && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="mt-8 h-14 w-full rounded-[24px] bg-background text-lg text-[#FF3B30] shadow-[0_1px_1px_rgba(0,0,0,0.03)] active:bg-background/70"
          >
            Delete Event
          </button>
        )}

        {/* Action buttons */}
        {!isMobile && <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/50 bg-muted/30">
          {isEditing && !readOnly && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[#FF3B30] can-hover:hover:bg-[#FF3B30]/10 can-hover:hover:text-[#FF3B30]"
            >
              Delete
            </Button>
          ) : <span />}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-muted hover:bg-muted/80 text-foreground"
              >
                {isEditing ? "Save" : "Add"}
              </Button>
            )}
          </div>
        </div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
