"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface BootSequenceProps {
  onComplete: () => void;
  autoStart?: boolean;
}

export function BootSequence({ onComplete, autoStart = true }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(autoStart);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [started, onComplete]);

  const start = () => setStarted(true);

  if (!started) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <FontAwesomeIcon
        icon={faApple as IconProp}
        className="w-20 h-20 text-white/80"
      />
      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/80 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Hook for manual start control
export function useBootSequence() {
  const [isBooting, setIsBooting] = useState(false);
  const start = () => setIsBooting(true);
  const reset = () => setIsBooting(false);
  return { isBooting, start, reset };
}
