import type { Conversation, Message, Reaction, Recipient } from "@/types/messages";

export interface MessagesSeedContact {
  name: string;
  title?: string;
  prompt?: string;
  bio?: string;
}

const getTimeAgo = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

export const FALLBACK_MESSAGE_CONTACTS: MessagesSeedContact[] = [
  {
    name: "Maya Chen",
    title: "Product Designer",
    prompt:
      "You are Maya Chen, a thoughtful product designer. You text with warmth, clarity, and a strong point of view about craft and user experience.",
    bio: "Maya Chen is a fictional product designer used as fallback demo content for Messages.",
  },
  {
    name: "Leo Park",
    title: "Software Engineer",
    prompt:
      "You are Leo Park, an engineer who is concise, curious, and a little playful. You like talking about building things and shipping fast.",
    bio: "Leo Park is a fictional engineer used as fallback demo content for Messages.",
  },
  {
    name: "Nina Patel",
    title: "Food Friend",
    prompt:
      "You are Nina Patel, upbeat and socially sharp. You text with energy, strong opinions, and a bias toward making plans.",
    bio: "Nina Patel is a fictional friend used as fallback demo content for Messages.",
  },
];

export const FALLBACK_MESSAGE_CONVERSATIONS: Conversation[] = [
  {
    id: "seed-leo-1",
    recipients: [{ id: "seed-recipient-leo", name: "Leo Park" }],
    lastMessageTime: getTimeAgo(18),
    unreadCount: 0,
    pinned: true,
    messages: [
      {
        id: "seed-message-leo-1",
        content: "thinking about rebuilding a tiny side project this weekend",
        sender: "me",
        timestamp: getTimeAgo(26),
      },
      {
        id: "seed-message-leo-2",
        content: "do it. tiny projects are where all the fun is",
        sender: "Leo Park",
        timestamp: getTimeAgo(18),
      },
    ],
  },
  {
    id: "seed-group-1",
    recipients: [
      { id: "seed-recipient-maya", name: "Maya Chen" },
      { id: "seed-recipient-nina", name: "Nina Patel" },
    ],
    lastMessageTime: getTimeAgo(43),
    unreadCount: 1,
    messages: [
      {
        id: "seed-message-group-1",
        content: "where should we go for dinner friday",
        sender: "me",
        timestamp: getTimeAgo(55),
      },
      {
        id: "seed-message-group-2",
        content: "somewhere cozy, not impossible to get into",
        sender: "Maya Chen",
        timestamp: getTimeAgo(48),
      },
      {
        id: "seed-message-group-3",
        content: "i vote for somewhere with great dessert and zero scene",
        sender: "Nina Patel",
        timestamp: getTimeAgo(43),
      },
    ],
  },
];

function isReaction(value: unknown): value is Reaction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Reaction>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.sender === "string" &&
    typeof candidate.timestamp === "string"
  );
}

function isRecipient(value: unknown): value is Recipient {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Recipient>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    (candidate.avatar === undefined || typeof candidate.avatar === "string") &&
    (candidate.bio === undefined || typeof candidate.bio === "string") &&
    (candidate.title === undefined || typeof candidate.title === "string")
  );
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Message> & { mentions?: unknown };
  const mentionsValid =
    candidate.mentions === undefined ||
    (Array.isArray(candidate.mentions) &&
      candidate.mentions.every(
        (mention) =>
          mention &&
          typeof mention === "object" &&
          typeof (mention as { id?: unknown }).id === "string" &&
          typeof (mention as { name?: unknown }).name === "string"
      ));

  return (
    typeof candidate.id === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.sender === "string" &&
    typeof candidate.timestamp === "string" &&
    (candidate.htmlContent === undefined ||
      typeof candidate.htmlContent === "string") &&
    (candidate.type === undefined || candidate.type === "silenced") &&
    mentionsValid &&
    (candidate.reactions === undefined ||
      (Array.isArray(candidate.reactions) &&
        candidate.reactions.every(isReaction)))
  );
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Conversation>;
  return (
    typeof candidate.id === "string" &&
    (candidate.name === undefined || typeof candidate.name === "string") &&
    Array.isArray(candidate.recipients) &&
    candidate.recipients.every(isRecipient) &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isMessage) &&
    typeof candidate.lastMessageTime === "string" &&
    typeof candidate.unreadCount === "number" &&
    (candidate.pinned === undefined || typeof candidate.pinned === "boolean") &&
    (candidate.isTyping === undefined ||
      typeof candidate.isTyping === "boolean") &&
    (candidate.hideAlerts === undefined ||
      typeof candidate.hideAlerts === "boolean")
  );
}

export function decodeMessagesSeedContacts(
  payload: unknown
): MessagesSeedContact[] | null {
  if (!Array.isArray(payload)) return null;
  const decoded = payload.filter((item): item is MessagesSeedContact => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<MessagesSeedContact>;
    return (
      typeof candidate.name === "string" &&
      (candidate.title === undefined || typeof candidate.title === "string") &&
      (candidate.prompt === undefined || typeof candidate.prompt === "string") &&
      (candidate.bio === undefined || typeof candidate.bio === "string")
    );
  });
  return decoded.length === payload.length ? decoded : null;
}

export function decodeMessagesSeedConversations(
  payload: unknown
): Conversation[] | null {
  if (!Array.isArray(payload) || !payload.every(isConversation)) {
    return null;
  }
  return payload;
}
