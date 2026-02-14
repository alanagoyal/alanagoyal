"use client";

import App from "./app";

interface MessagesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, prevent URL updates
  focusModeActive?: boolean; // When true, mute all notifications and sounds
  onUnreadBadgeCountChange?: (count: number) => void;
}

// Wrapper for Messages app in the desktop/mobile environment
export function MessagesApp({
  isMobile = false,
  inShell = false,
  focusModeActive = false,
  onUnreadBadgeCountChange,
}: MessagesAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App
        isDesktop={!isMobile}
        inShell={inShell}
        focusModeActive={focusModeActive}
        onUnreadBadgeCountChange={onUnreadBadgeCountChange}
      />
    </div>
  );
}
