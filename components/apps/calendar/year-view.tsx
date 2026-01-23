"use client";

import { cn } from "@/lib/utils";
import {
  getYearMonths,
  getMonthViewDays,
  formatDateHeader,
  isToday,
  isSameMonth,
  format,
} from "./utils";

interface YearViewProps {
  currentDate: Date;
  onMonthClick?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function YearView({
  currentDate,
  onMonthClick,
  onDateClick,
}: YearViewProps) {
  const year = currentDate.getFullYear();
  const months = getYearMonths(year);

  return (
    <div className="flex flex-col h-full">
      {/* Year header */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h1 className="text-2xl font-semibold">
          {formatDateHeader(currentDate, "year")}
        </h1>
      </div>

      {/* Months grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-6">
          {months.map((monthDate, monthIdx) => (
            <MiniMonth
              key={monthIdx}
              monthDate={monthDate}
              onMonthClick={onMonthClick}
              onDateClick={onDateClick}
            />
          ))}
        </div>
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
