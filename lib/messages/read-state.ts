import type { Conversation } from "@/types/messages";

export function getConversationReadStateLabel(
  conversation: Pick<Conversation, "unreadCount">,
): "Mark as Read" | "Mark as Unread" {
  return conversation.unreadCount > 0 ? "Mark as Read" : "Mark as Unread";
}

export function toggleConversationReadState(
  conversations: Conversation[],
  conversationId: string,
): Conversation[] {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          unreadCount: conversation.unreadCount > 0 ? 0 : 1,
        }
      : conversation,
  );
}
