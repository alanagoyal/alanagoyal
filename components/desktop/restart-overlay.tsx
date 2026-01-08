"use client";

import { BootSequence } from "./boot-sequence";

interface RestartOverlayProps {
  onBootComplete: () => void;
}

export function RestartOverlay({ onBootComplete }: RestartOverlayProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <BootSequence onComplete={onBootComplete} />
    </div>
  );
}
