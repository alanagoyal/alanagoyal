"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  getYearMonths,
  getMonthViewDays,
  isToday,
  isSameMonth,
  format,
} from "./utils";

interface YearViewProps {
  currentDate: Date;
  onMonthClick?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
  onYearChange?: (date: Date) => void;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Number of years to render before and after current year
const YEARS_BUFFER = 10;

export function YearView({
  currentDate,
  onMonthClick,
  onDateClick,
  onYearChange,
}: YearViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [visibleYear, setVisibleYear] = useState(currentDate.getFullYear());
  const initialScrollDone = useRef(false);
  const lastCurrentDate = useRef(currentDate);

  // Generate array of years to render
  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const result: number[] = [];
    for (let i = -YEARS_BUFFER; i <= YEARS_BUFFER; i++) {
      result.push(currentYear + i);
    }
    return result;
  }, [currentDate]);

  // Find the index of the current year
  const currentYearIndex = YEARS_BUFFER;

  // Scroll to current year on initial render or when currentDate changes externally
  useEffect(() => {
    const dateChanged = lastCurrentDate.current.getTime() !== currentDate.getTime();

    if (!initialScrollDone.current || dateChanged) {
      const yearEl = yearRefs.current.get(currentYearIndex);
      if (yearEl && scrollRef.current) {
        // Scroll to center the current year in the viewport
        const containerHeight = scrollRef.current.clientHeight;
        const yearHeight = yearEl.clientHeight;
        const scrollTop = yearEl.offsetTop - (containerHeight / 2) + (yearHeight / 2);
        scrollRef.current.scrollTop = Math.max(0, scrollTop);
        initialScrollDone.current = true;
        lastCurrentDate.current = currentDate;

        if (dateChanged) {
          setVisibleYear(currentDate.getFullYear());
          onYearChange?.(currentDate);
        }
      }
    }
  }, [currentYearIndex, currentDate, onYearChange]);

  // Track visible year on scroll
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const scrollTop = scrollEl.scrollTop;
      const viewportMiddle = scrollTop + scrollEl.clientHeight / 3;

      // Find the year that's at the viewport middle
      let closestYearIdx = 0;
      let closestDistance = Infinity;

      yearRefs.current.forEach((el, idx) => {
        const yearMiddle = el.offsetTop + el.clientHeight / 2;
        const distance = Math.abs(yearMiddle - viewportMiddle);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestYearIdx = idx;
        }
      });

      const year = years[closestYearIdx];
      if (year && year !== visibleYear) {
        setVisibleYear(year);
        onYearChange?.(new Date(year, 0, 1));
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [years, visibleYear, onYearChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Year header - updates based on scroll position */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">{visibleYear}</h1>
      </div>

      {/* Scrollable years container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {years.map((year, yearIdx) => (
          <div
            key={year}
            ref={(el) => {
              if (el) yearRefs.current.set(yearIdx, el);
            }}
            className="mb-8"
          >
            {/* Year label for non-current years (helps with orientation) */}
            {year !== visibleYear && (
              <div className="text-lg font-semibold text-muted-foreground mb-4">
                {year}
              </div>
            )}

            {/* Months grid for this year */}
            <div className="grid grid-cols-4 gap-6">
              {getYearMonths(year).map((monthDate, monthIdx) => (
                <MiniMonth
                  key={monthIdx}
                  monthDate={monthDate}
                  onMonthClick={onMonthClick}
                  onDateClick={onDateClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MiniMonthProps {
  monthDate: Date;
  onMonthClick?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

function MiniMonth({ monthDate, onMonthClick, onDateClick }: MiniMonthProps) {
  const days = getMonthViewDays(monthDate);
  const weeks: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      {/* Month name */}
      <button
        className="text-red-500 font-semibold mb-2 hover:underline text-left"
        onClick={() => onMonthClick?.(monthDate)}
      >
        {format(monthDate, "MMMM")}
      </button>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LETTERS.map((letter, idx) => (
          <div
            key={idx}
            className="text-center text-xs text-muted-foreground w-6"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="space-y-0.5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIdx) => {
              const isCurrentMonth = isSameMonth(day, monthDate);
              const dayIsToday = isToday(day);

              return (
                <button
                  key={dayIdx}
                  className={cn(
                    "text-xs w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isCurrentMonth && "hover:bg-muted",
                    dayIsToday && "bg-red-500 text-white hover:bg-red-600"
                  )}
                  onClick={() => onDateClick?.(day)}
                  disabled={!isCurrentMonth}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
