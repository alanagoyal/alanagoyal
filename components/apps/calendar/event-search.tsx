"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { format, parseISO } from "date-fns";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { Calendar, CalendarEvent } from "./types";
import { formatEventTime } from "./utils";
import {
  getNextCalendarSearchResultIndex,
  searchCalendarEvents,
} from "./search-utils";

interface EventSearchProps {
  events: CalendarEvent[];
  calendars: Calendar[];
  currentDate: Date;
  onSelect: (event: CalendarEvent) => void;
  isMobile?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

export function EventSearch({
  events,
  calendars,
  currentDate,
  onSelect,
  isMobile = false,
  inputRef,
}: EventSearchProps) {
  const windowFocus = useWindowFocus();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = inputRef ?? internalInputRef;
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const results = useMemo(
    () => searchCalendarEvents(events, calendars, query, currentDate),
    [calendars, currentDate, events, query],
  );
  const calendarById = useMemo(
    () => new Map(calendars.map((calendar) => [calendar.id, calendar])),
    [calendars],
  );
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (windowFocus && !windowFocus.isFocused) return;

      if (document.activeElement === searchInputRef.current) {
        event.preventDefault();
        event.stopPropagation();
        searchInputRef.current?.blur();
        return;
      }

      if (query) {
        event.preventDefault();
        event.stopPropagation();
        setQuery("");
        setHighlightedIndex(0);
      }
    };

    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [query, searchInputRef, windowFocus]);

  useEffect(() => {
    setHighlightedIndex((index) => Math.min(index, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    if (!isSearching || results.length === 0) return;
    resultsRef.current
      ?.querySelector(`[data-calendar-search-result-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isSearching, results.length]);

  const selectResult = (event: CalendarEvent) => {
    setQuery("");
    setHighlightedIndex(0);
    onSelect(event);
  };

  return (
    <div className={cn("relative", isMobile ? "w-full" : "w-52")}>
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={searchInputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlightedIndex(0);
        }}
        onKeyDown={(event) => {
          if (
            results.length > 0 &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            const direction: 1 | -1 = event.key === "ArrowDown" ? 1 : -1;
            setHighlightedIndex((index) =>
              getNextCalendarSearchResultIndex(index, results.length, direction),
            );
            return;
          }
          if (event.key === "Enter" && results[highlightedIndex]) {
            event.preventDefault();
            selectResult(results[highlightedIndex]);
          }
        }}
        placeholder="Search"
        aria-label="Search calendar events"
        className="h-7 w-full rounded-lg border border-muted-foreground/15 bg-background/70 py-0.5 pl-7 pr-7 text-sm outline-none placeholder:text-muted-foreground focus:border-[#0A7CFF]/60"
      />
      {query && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setQuery("");
            setHighlightedIndex(0);
            searchInputRef.current?.focus();
          }}
          aria-label="Clear calendar search"
          className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground can-hover:hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      {isSearching && (
        <div ref={resultsRef} className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-muted-foreground/20 bg-background/95 p-1 shadow-xl backdrop-blur-xl">
          {results.length > 0 ? results.map((event, index) => {
            const calendar = calendarById.get(event.calendarId);
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => selectResult(event)}
                data-calendar-search-result-index={index}
                aria-current={isHighlighted ? "true" : undefined}
                className={cn(
                  "flex min-h-12 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left active:bg-muted",
                  isHighlighted && !isMobile
                    ? "bg-[#0A7CFF] text-white"
                    : "can-hover:hover:bg-muted",
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: calendar?.color ?? "#0A7CFF" }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{event.title}</span>
                  <span className={cn("block truncate text-xs", isHighlighted && !isMobile ? "text-white/80" : "text-muted-foreground")}>
                    {format(parseISO(event.startDate), "EEE, MMM d")}
                    {event.startTime ? ` at ${formatEventTime(event.startTime)}` : " · All day"}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                </span>
              </button>
            );
          }) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No events found</p>
          )}
        </div>
      )}
    </div>
  );
}
