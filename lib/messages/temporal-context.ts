import { Message } from "@/types/messages";

/**
 * Format a timestamp as a relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now.getTime() - messageTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffMinutes === 1) {
    return "1 min ago";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  if (diffHours === 1) {
    return "1 hour ago";
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return "yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const month = messageTime.toLocaleString("en-US", { month: "short" });
  const day = messageTime.getDate();
  return `${month} ${day}`;
}

/**
 * Format the conversation with timestamps (chronological order)
 */
export function formatConversation(messages: Message[]): string {
  return messages
    .filter((m) => m.sender !== "system")
    .map((msg) => {
      const time = formatRelativeTime(msg.timestamp);
      const reactions = msg.reactions?.length
        ? ` [${msg.reactions.map((r) => `${r.sender}: ${r.type}`).join(", ")}]`
        : "";
      return `[${time}] ${msg.sender}: ${msg.content}${reactions}`;
    })
    .join("\n");
}

/**
 * Format a single message line with "me" replaced by "anon"
 */
function formatMessageLine(msg: Message): string {
  const time = formatRelativeTime(msg.timestamp);
  const sender = msg.sender === "me" ? "anon" : msg.sender;
  const reactions = msg.reactions?.length
    ? ` [${msg.reactions.map((r) => {
        const reactorName = r.sender === "me" ? "anon" : r.sender;
        return `${reactorName}: ${r.type}`;
      }).join(", ")}]`
    : "";
  return `[${time}] ${sender}: ${msg.content}${reactions}`;
}

/**
 * Format conversation in reverse chronological order (newest first)
 * with "me" replaced by "anon" for the human user
 */
export function formatConversationReversed(messages: Message[]): {
  mostRecent: string | null;
  history: string;
} {
  const filtered = messages.filter((m) => m.sender !== "system");

  if (filtered.length === 0) {
    return { mostRecent: null, history: "" };
  }

  const mostRecentMsg = filtered[filtered.length - 1];
  const mostRecent = formatMessageLine(mostRecentMsg);

  // History is everything except the most recent, in reverse order.
  // If there's only one message, history will be empty string.
  const historyMessages = filtered.slice(0, -1).reverse();
  const history = historyMessages.map(formatMessageLine).join("\n");

  return { mostRecent, history };
}

/**
 * Get the last speaker (to avoid same person speaking twice in a row)
 */
export function getLastSpeaker(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.sender !== "system") {
      return msg.sender;
    }
  }
  return null;
}

/**
 * Get conversation state for the model
 */
export function getConversationState(messages: Message[]): {
  messagesSinceHuman: number;
  lastHumanMessage: string | null;
  lastHumanTime: string | null;
  lastSpeaker: string | null;
} {
  let messagesSinceHuman = 0;
  let lastHumanMessage: string | null = null;
  let lastHumanTime: string | null = null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.sender === "me") {
      lastHumanMessage = msg.content;
      lastHumanTime = formatRelativeTime(msg.timestamp);
      break;
    }
    if (msg.sender !== "system") {
      messagesSinceHuman++;
    }
  }

  const lastSpeaker = getLastSpeaker(messages);

  return { messagesSinceHuman, lastHumanMessage, lastHumanTime, lastSpeaker };
}
