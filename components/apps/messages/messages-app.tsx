"use client";

import App from "./app";
import type { MessagesNotificationPayload } from "@/types/messages/notification";
import type { MessagesConversationSelectRequest } from "@/types/messages/selection";

interface MessagesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, prevent URL updates
  focusModeActive?: boolean; // When true, mute all notifications and sounds
  onUnreadBadgeCountChange?: (count: number) => void;
  onNotification?: (notification: MessagesNotificationPayload) => void;
  externalSelectConversationRequest?: MessagesConversationSelectRequest | null;
  onExternalSelectRequestHandled?: (requestId: number) => void;
}

// Wrapper for Messages app in the desktop/mobile environment
export function MessagesApp({
  isMobile = false,
  inShell = false,
  focusModeActive = false,
  onUnreadBadgeCountChange,
  onNotification,
  externalSelectConversationRequest,
  onExternalSelectRequestHandled,
}: MessagesAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App
        isDesktop={!isMobile}
        inShell={inShell}
        focusModeActive={focusModeActive}
        onUnreadBadgeCountChange={onUnreadBadgeCountChange}
        onNotification={onNotification}
        externalSelectConversationRequest={externalSelectConversationRequest}
        onExternalSelectRequestHandled={onExternalSelectRequestHandled}
      />
    </div>
  );
}
