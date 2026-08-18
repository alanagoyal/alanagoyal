import type { Conversation } from "@/types/messages";

export const NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX =
  "notification-center-dismissed:";

type NotificationCenterStorage = Pick<Storage, "getItem" | "setItem">;

interface WeatherNotificationData {
  temp: number;
  currentTime: string;
  code: number;
  high: number;
  low: number;
}

export function isNotificationCenterItemDismissed(
  storage: NotificationCenterStorage,
  itemId: string,
  signature: string
): boolean {
  try {
    return (
      storage.getItem(`${NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX}${itemId}`) ===
      signature
    );
  } catch {
    return false;
  }
}

export function shouldHideNotificationCenterItem(
  storage: NotificationCenterStorage,
  itemId: string,
  signature: string,
  signaturePending = false
): boolean {
  if (!signaturePending) {
    return isNotificationCenterItemDismissed(storage, itemId, signature);
  }

  try {
    return (
      storage.getItem(`${NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX}${itemId}`) !==
      null
    );
  } catch {
    return false;
  }
}

export function dismissNotificationCenterItem(
  storage: NotificationCenterStorage,
  itemId: string,
  signature: string
): void {
  try {
    storage.setItem(
      `${NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX}${itemId}`,
      signature
    );
  } catch {
    // The current render still hides the card when browser storage is unavailable.
  }
}

export function getWeatherNotificationSignature(
  weather: WeatherNotificationData | null,
  loading: boolean,
  now = new Date()
): string {
  if (weather) {
    return [
      weather.currentTime,
      weather.temp,
      weather.code,
      weather.high,
      weather.low,
    ].join(":");
  }

  if (loading) return "loading";

  return `unavailable:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

export interface UnreadMessagesNotification {
  latestConversation: Conversation;
  signature: string;
  totalUnread: number;
}

export function getUnreadMessagesNotification(
  conversations: Conversation[]
): UnreadMessagesNotification | null {
  const unreadConversations = conversations
    .filter(
      (conversation) =>
        conversation.unreadCount > 0 && conversation.messages.length > 0
    )
    .sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

  const latestConversation = unreadConversations[0];
  if (!latestConversation) return null;

  return {
    latestConversation,
    totalUnread: unreadConversations.reduce(
      (sum, conversation) => sum + conversation.unreadCount,
      0
    ),
    signature: unreadConversations
      .map((conversation) => {
        const latestMessage = conversation.messages.at(-1);
        return [
          conversation.id,
          conversation.unreadCount,
          conversation.lastMessageTime,
          latestMessage?.id ?? "",
        ].join(":");
      })
      .join("|"),
  };
}
