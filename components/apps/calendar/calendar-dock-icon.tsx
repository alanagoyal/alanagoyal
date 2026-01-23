"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface CalendarDockIconProps {
  size?: number;
}

export function CalendarDockIcon({ size = 48 }: CalendarDockIconProps) {
  const [date, setDate] = useState(new Date());

  // Update date at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Update immediately, then at midnight
    const timeout = setTimeout(() => {
      setDate(new Date());
      // Set interval for subsequent days
      const interval = setInterval(() => {
        setDate(new Date());
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const dayOfWeek = format(date, "EEE").toUpperCase();
  const dayNumber = format(date, "d");

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-md bg-white"
      style={{ width: size, height: size }}
    >
      {/* Red header bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-[#FF3B30]"
        style={{ height: size * 0.28 }}
      >
        <span
          className="text-white font-semibold tracking-wide"
          style={{ fontSize: size * 0.18 }}
        >
          {dayOfWeek}
        </span>
      </div>

      {/* White body with date */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-white"
        style={{ height: size * 0.72 }}
      >
        <span
          className="text-[#1c1c1e] font-light"
          style={{ fontSize: size * 0.52, lineHeight: 1 }}
        >
          {dayNumber}
        </span>
      </div>
    </div>
  );
}
