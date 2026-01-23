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

  const dayOfWeek = format(date, "EEE"); // Short day name (e.g., "Fri")
  const dayNumber = format(date, "d");

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-md bg-white flex flex-col items-center justify-center"
      style={{ width: size, height: size, paddingTop: size * 0.04 }}
    >
      {/* Day name in red */}
      <span
        className="text-[#FF3B30] font-medium leading-none"
        style={{ fontSize: size * 0.22 }}
      >
        {dayOfWeek}
      </span>

      {/* Date number in black */}
      <span
        className="text-[#1c1c1e] font-normal leading-none"
        style={{ fontSize: size * 0.56, marginTop: -size * 0.04 }}
      >
        {dayNumber}
      </span>
    </div>
  );
}
