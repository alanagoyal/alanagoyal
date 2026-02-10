"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSystemSettings } from "@/lib/system-settings-context";
import { getWallpaperPath } from "@/lib/os-versions";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { currentOS } = useSystemSettings();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Time in format "6:24" (no leading zero, no AM/PM)
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${displayHours}:${minutes}`);

      // Date in format "Wed Jan 7"
      const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
      const month = now.toLocaleDateString("en-US", { month: "short" });
      const day = now.getDate();
      setCurrentDate(`${weekday} ${month} ${day}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center transition-opacity duration-300 bg-black ${
        isUnlocking ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleUnlock}
    >
      {/* Wallpaper background (not blurred) - covers everything */}
      <div className="absolute inset-0">
        <Image
          src={getWallpaperPath(currentOS.id)}
          alt="Lock screen wallpaper"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>

      {/* Date and Time - positioned near top */}
      <div className="mt-24 text-center relative z-10">
        <div
          className="text-2xl font-medium text-white/80 tracking-wide"
          style={{ textShadow: "0 0 20px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)" }}
        >
          {currentDate}
        </div>
        <div
          className="text-[120px] text-white/70 leading-none tracking-tight"
          style={{ fontWeight: 500, textShadow: "0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)" }}
        >
          {currentTime}
        </div>
      </div>

      {/* Spacer to push user section to bottom */}
      <div className="flex-1" />

      {/* User Avatar and Name - at bottom */}
      <div className="mb-16 flex flex-col items-center relative z-10">
        {/* Avatar with shadow */}
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl">
          <Image
            src="/headshot.jpg"
            alt="Alana Goyal"
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Name */}
        <div className="mt-2 text-sm font-medium text-white drop-shadow-md">
          Alana Goyal
        </div>

        {/* Touch ID prompt */}
        <div className="mt-1 text-xs text-white/70 drop-shadow-sm">
          Touch ID or Enter Password
        </div>
      </div>
    </div>
  );
}
