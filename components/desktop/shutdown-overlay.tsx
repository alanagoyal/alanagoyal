"use client";

import { useState } from "react";
import { BootSequence } from "./boot-sequence";

interface ShutdownOverlayProps {
  onBootComplete: () => void;
}

export function ShutdownOverlay({ onBootComplete }: ShutdownOverlayProps) {
  const [isBooting, setIsBooting] = useState(false);

  const handleClick = () => {
    if (!isBooting) {
      setIsBooting(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      {isBooting && <BootSequence onComplete={onBootComplete} />}
    </div>
  );
}
