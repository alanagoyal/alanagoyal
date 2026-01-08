"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface ShutdownOverlayProps {
  onBootComplete: () => void;
}

export function ShutdownOverlay({ onBootComplete }: ShutdownOverlayProps) {
  const [phase, setPhase] = useState<"off" | "booting">("off");
  const [progress, setProgress] = useState(0);

  const handleClick = () => {
    if (phase === "off") {
      setPhase("booting");
    }
  };

  useEffect(() => {
    if (phase === "booting") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(onBootComplete, 500);
            return 100;
          }
          return prev + 5;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [phase, onBootComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >

      {phase === "booting" && (
        <div className="flex flex-col items-center gap-8">
          <FontAwesomeIcon
            icon={faApple as IconProp}
            className="w-20 h-20 text-white/80"
          />
          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
