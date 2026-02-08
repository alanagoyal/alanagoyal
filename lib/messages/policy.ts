import { Conversation, Message } from "@/types/messages";

export const MAX_CONSECUTIVE_AI_MESSAGES = 4;

const GREETING_ONLY_RE =
  /^(hey|hi|hello|yo|sup|what(?:'| i)s up|good (morning|afternoon|evening)|howdy)[!.? ]*$/i;
const CONTEXT_REFERENCE_RE =
  /\b(continue|continuing|last time|earlier|as we discussed|follow up|following up|regarding|about|you said|we were talking)\b/i;
const USER_DIRECTED_QUESTION_RE =
  /\b(what do you think|your take|your thoughts|can you|could you|would you|how about you|you think)\b/i;

export type QueueControlHints = {
  forceWrapUp: boolean;
  allowReactions: boolean;
  blockedParticipants: string[];
  reason: string;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countTailConsecutiveAiMessages(messages: Message[]): number {
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const sender = messages[i].sender;
    if (sender === "me" || sender === "system") {
      break;
    }
    count++;
  }
  return count;
}

function lastNonSystemMessage(messages: Message[]): Message | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender !== "system") {
      return messages[i];
    }
  }
  return null;
}

function hasRepetitionRisk(messages: Message[]): boolean {
  const aiMessages = messages
    .filter((m) => m.sender !== "me" && m.sender !== "system")
    .slice(-6)
    .map((m) => normalizeText(m.content))
    .filter(Boolean);

  if (aiMessages.length < 4) return false;

  const freq = new Map<string, number>();
  for (const msg of aiMessages) {
    freq.set(msg, (freq.get(msg) ?? 0) + 1);
  }
  return [...freq.values()].some((count) => count >= 2);
}

export function isQuestionDirectedAtUser(messages: Message[]): boolean {
  const last = lastNonSystemMessage(messages);
  if (!last || last.sender === "me") return false;

  const content = last.content.trim();
  if (!content.includes("?")) return false;

  return USER_DIRECTED_QUESTION_RE.test(content.toLowerCase());
}

export function shouldAllowReaction(conversation: Conversation): boolean {
  const recent = conversation.messages
    .filter((m) => m.sender !== "system")
    .slice(-12);

  if (recent.length === 0) return true;

  const reactionTurns = recent.filter((m) => (m.reactions?.length ?? 0) > 0).length;
  const ratio = reactionTurns / recent.length;

  return ratio < 0.35;
}

export function evaluateQueueControl(conversation: Conversation): QueueControlHints {
  const consecutiveAiCount = countTailConsecutiveAiMessages(conversation.messages);
  const repetitionRisk = hasRepetitionRisk(conversation.messages);
  const forceWrapUp = consecutiveAiCount >= MAX_CONSECUTIVE_AI_MESSAGES || repetitionRisk;

  let reason = "";
  if (consecutiveAiCount >= MAX_CONSECUTIVE_AI_MESSAGES) {
    reason = "hit_consecutive_ai_cap";
  } else if (repetitionRisk) {
    reason = "repetition_risk";
  }

  const lastSpeaker = lastNonSystemMessage(conversation.messages)?.sender ?? null;
  const blockedParticipants =
    lastSpeaker && lastSpeaker !== "me" ? [lastSpeaker] : [];

  return {
    forceWrapUp,
    allowReactions: shouldAllowReaction(conversation),
    blockedParticipants,
    reason,
  };
}

function getLastHumanTimestamp(messages: Message[]): Date | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "me") {
      const parsed = new Date(messages[i].timestamp);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  return null;
}

export function shouldResetThreadForGreeting(
  userMessage: string,
  conversation: Conversation
): boolean {
  const text = userMessage.trim();
  if (!text) return false;

  if (!GREETING_ONLY_RE.test(text)) return false;
  if (CONTEXT_REFERENCE_RE.test(text)) return false;

  const lastHumanAt = getLastHumanTimestamp(conversation.messages);
  if (!lastHumanAt) return true;

  const idleMs = Date.now() - lastHumanAt.getTime();
  const THIRTY_MIN_MS = 30 * 60 * 1000;
  return idleMs > THIRTY_MIN_MS;
}

export function buildWrapUpMessageText(
  summary: string | undefined,
  nextStep: string | undefined,
  question: string | undefined,
  fallbackTopic: string
): string {
  const summaryText = (summary || "").trim() || `Quick synthesis: we covered ${fallbackTopic}.`;
  const nextStepText =
    (nextStep || "").trim() || "Practical next step: pick one concrete action and I can help outline it.";
  const questionText =
    (question || "").trim() || "Want to continue with a focused next step?";

  return `${summaryText}\n\n${nextStepText}\n\n${questionText}`;
}
