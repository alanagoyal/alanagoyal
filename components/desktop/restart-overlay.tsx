"use client";

import { BootSequence } from "./boot-sequence";

interface RestartOverlayProps {
  onBootComplete: () => void;
}

export function RestartOverlay({ onBootComplete }: RestartOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <BootSequence onComplete={onBootComplete} />
    </div>
  );
}
