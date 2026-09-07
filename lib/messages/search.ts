import type { Conversation, Message } from "@/types/messages";

export interface MessageSearchResult {
  conversation: Conversation;
  message: Message;
}

export function getNextMessageSearchResultIndex(
  currentIndex: number,
  resultCount: number,
  direction: 1 | -1,
): number {
  if (resultCount <= 0) return 0;
  return (currentIndex + direction + resultCount) % resultCount;
}

export function getMessageSearchPreviewText(
  content: string,
  query: string,
  contextLength = 96,
): string {
  const messageText = content.replace(/\s+/g, " ").trim();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return messageText;

  const matchIndex = messageText.toLocaleLowerCase().indexOf(normalizedQuery);
  if (matchIndex < 0) return messageText;

  const leadingContextLength = Math.min(18, Math.floor(contextLength / 4));
  const contextStart = Math.max(0, matchIndex - leadingContextLength);
  const contextEnd = Math.min(
    messageText.length,
    Math.max(contextStart + contextLength, matchIndex + normalizedQuery.length),
  );
  const excerpt = messageText.slice(contextStart, contextEnd).trim();

  return `${contextStart > 0 ? "…" : ""}${excerpt}${
    contextEnd < messageText.length ? "…" : ""
  }`;
}

export function getConversationSearchName(conversation: Conversation): string {
  return (
    conversation.name ||
    conversation.recipients.map((recipient) => recipient.name).join(", ")
  );
}

export function getMessageSearchResults(
  conversations: Conversation[],
  query: string,
  limit = 12,
): MessageSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery || limit <= 0) return [];

  const results: MessageSearchResult[] = [];
  for (const conversation of conversations) {
    for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
      const message = conversation.messages[index];
      if (
        message.sender !== "system" &&
        message.content.toLocaleLowerCase().includes(normalizedQuery)
      ) {
        results.push({ conversation, message });
        if (results.length === limit) return results;
      }
    }
  }

  return results;
}

export function getConversationNameMatches(
  conversations: Conversation[],
  query: string,
): Conversation[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return conversations.filter((conversation) =>
    getConversationSearchName(conversation)
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}
