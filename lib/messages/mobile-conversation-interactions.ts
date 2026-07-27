import type { Conversation, Message } from "@/types/messages";

export const MOBILE_CONVERSATION_LONG_PRESS_DELAY_MS = 550;
export const MOBILE_CONVERSATION_LONG_PRESS_MOVE_TOLERANCE = 10;

interface Point {
  x: number;
  y: number;
}

export function canStartMobileConversationLongPress(pointerType: string) {
  return pointerType === "touch" || pointerType === "pen";
}

export function didMobileConversationLongPressMove(
  origin: Point,
  current: Point,
) {
  return (
    Math.abs(current.x - origin.x) >
      MOBILE_CONVERSATION_LONG_PRESS_MOVE_TOLERANCE ||
    Math.abs(current.y - origin.y) >
      MOBILE_CONVERSATION_LONG_PRESS_MOVE_TOLERANCE
  );
}

export function isConversationContextMenuKeyboardShortcut(
  key: string,
  shiftKey: boolean,
) {
  return key === "ContextMenu" || (shiftKey && key === "F10");
}

export function getConversationDisplayName(conversation: Conversation) {
  return (
    conversation.name ||
    conversation.recipients.map((recipient) => recipient.name).join(", ") ||
    "New Message"
  );
}

export function getConversationPreviewMessages(
  conversation: Conversation,
  limit = 4,
): Message[] {
  if (limit <= 0) return [];

  return conversation.messages
    .filter(
      (message) =>
        message.sender !== "system" && message.content.trim().length > 0,
    )
    .slice(-limit);
}
