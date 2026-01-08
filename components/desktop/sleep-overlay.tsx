"use client";

import { useState } from "react";

interface SleepOverlayProps {
  onWake: () => void;
}

export function SleepOverlay({ onWake }: SleepOverlayProps) {
  const [isWaking, setIsWaking] = useState(false);

  const handleWake = () => {
    setIsWaking(true);
    setTimeout(() => {
      onWake();
    }, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black cursor-pointer transition-opacity duration-500 ${
        isWaking ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleWake}
    >
      {/* Completely black screen - click anywhere to wake */}
    </div>
  );
}
