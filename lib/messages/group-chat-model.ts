export interface GroupConversationReversed {
  mostRecent: string | null;
  history: string;
}

export interface GroupConversationState {
  messagesSinceHuman: number;
  lastHumanMessage: string | null;
  lastHumanTime: string | null;
  lastSpeaker: string | null;
}

export interface NamedParticipant {
  name: string;
}

export const GROUP_CHAT_MODEL = "gpt-5.2";

const REACTION_TYPES = [
  "heart",
  "like",
  "dislike",
  "laugh",
  "emphasize",
  "question",
] as const;

export function buildGroupPrompt(
  recipients: NamedParticipant[],
  participantDescriptions: string,
  conversationReversed: GroupConversationReversed,
  state: GroupConversationState
): string {
  const participantNames = recipients.map((recipient) => recipient.name).join(", ");

  let cadenceGuidance: string;
  if (state.messagesSinceHuman === 0) {
    cadenceGuidance = "The human just spoke. Respond naturally.";
  } else if (state.messagesSinceHuman <= 2) {
    cadenceGuidance = "A couple messages since the human spoke. Respond if you're addressed or have something genuinely NEW to add. Don't repeat what was already said.";
  } else {
    cadenceGuidance = "Several AI messages in a row. If the latest message asks anon a question, use `wait`; otherwise prefer `wrap_up`. Only respond when another AI participant clearly addresses you.";
  }

  return `You are in a group text with ${participantNames} and one other person (labeled "anon" below — don't call them that, just talk naturally).

PERSONAS:
${participantDescriptions}

MOST RECENT MESSAGE:
${conversationReversed.mostRecent || "(no messages yet)"}

CONVERSATION HISTORY (newest first):
${conversationReversed.history || "(no prior messages)"}

STATE:
- Messages since anon last spoke: ${state.messagesSinceHuman}
- Last speaker: ${state.lastSpeaker === "me" ? "anon" : state.lastSpeaker || "none"}

CADENCE: ${cadenceGuidance}

RULES:
1. BREVITY: You're texting. 1-2 sentences MAX. No paragraphs. Use casual abbreviations, fragments, lowercase — whatever fits your persona. Think real iMessage energy.
2. NO REPETITION: NEVER repeat a point someone already made in this conversation. If it's been said, move on or stay silent.
3. REACTIONS: Feel free to react when something warrants it — laugh at funny things, heart touching things. You can react AND respond in the same turn. Never react to your own message.
4. CONVERSATION FLOW: Talk to each other, not just to anon. If another participant asks you a question, ANSWER IT — don't wait.
5. WAIT: Use wait when anon (the human) specifically needs to respond. A participant's unaddressed question using "you" or "your" is directed at anon, so wait. If the message names or clearly addresses another AI participant, that participant should respond instead.
6. WRAP UP: If 3+ AI messages have passed without anon speaking, use wrap_up unless the latest message directly asks anon a question. A statement does not need wait; wrap up instead.

Pick the best action(s).`;
}

export function buildGroupTools(participantNames: string[], lastSpeaker: string | null) {
  const eligibleSpeakers = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter((name) => name !== lastSpeaker)
    : participantNames;

  const eligibleReactors = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter((name) => name !== lastSpeaker)
    : participantNames;

  return [
    {
      type: "function" as const,
      function: {
        name: "react",
        description: "Add an emoji reaction to the last message. React sparingly — only when genuinely warranted.",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleReactors.length > 0 ? eligibleReactors : participantNames,
            },
            reaction: {
              type: "string",
              enum: REACTION_TYPES,
            },
          },
          required: ["participant", "reaction"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "respond",
        description: "Send short text messages like real iMessage. Optionally react to the last message at the same time.",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
            },
            messages: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 3,
              description: "1-3 short texts. Each should be 1 sentence. Split separate thoughts into separate messages instead of one long block.",
            },
            reaction: {
              type: "string",
              enum: REACTION_TYPES,
              description: "Optional: also react to the last message before responding. Use when something genuinely warrants it.",
            },
          },
          required: ["participant", "messages"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "wait",
        description: "Stay silent because anon (the human) needs to respond. Use this when a participant asks an unaddressed question using 'you' or 'your'. Do not wait when another AI participant is named or clearly addressed.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "wrap_up",
        description: "End conversation with a brief friendly closing (1 sentence).",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
            },
            message: {
              type: "string",
              description: "Brief, natural sign-off. 1 sentence.",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
  ];
}
