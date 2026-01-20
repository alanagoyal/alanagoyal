import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Recipient, Message, ReactionType } from "@/types/messages";
import { initialContacts } from "@/data/messages/initial-contacts";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";
import {
  formatConversation,
  formatConversationReversed,
  getConversationState,
} from "@/lib/messages/temporal-context";

let client: OpenAI | null = null;
let loggerInitialized = false;

function getClient() {
  if (!client) {
    client = wrapOpenAI(
      new OpenAI({
        baseURL: "https://api.braintrust.dev/v1/proxy",
        apiKey: process.env.BRAINTRUST_API_KEY!,
        timeout: 30000,
        maxRetries: 3,
      })
    ) as unknown as OpenAI;
  }
  if (!loggerInitialized) {
    initLogger({
      projectName: "messages",
      apiKey: process.env.BRAINTRUST_API_KEY,
    });
    loggerInitialized = true;
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      recipients: recipientsRaw,
      messages: messagesRaw,
      isOneOnOne: isOneOnOneRaw = false,
    } = body as Record<string, unknown>;

    const isRecipientLike = (value: unknown): value is Recipient => {
      if (!value || typeof value !== "object") return false;
      const maybeName = (value as { name?: unknown }).name;
      return typeof maybeName === "string" && maybeName.trim().length > 0;
    };

    const isMessageLike = (value: unknown): value is Message => {
      if (!value || typeof value !== "object") return false;
      const v = value as { sender?: unknown; content?: unknown };
      return typeof v.sender === "string" && typeof v.content === "string";
    };

    const recipients = (Array.isArray(recipientsRaw) ? recipientsRaw : []).filter(
      isRecipientLike
    );

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid recipients" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const messages = (Array.isArray(messagesRaw) ? messagesRaw : []).filter(
      isMessageLike
    );

    const isOneOnOne = isOneOnOneRaw === true && recipients.length === 1;

    // Get conversation state
    const state = getConversationState(messages);
    const conversation = formatConversation(messages);
    const conversationReversed = formatConversationReversed(messages);

    // Build participant descriptions
    const participantDescriptions = recipients
      .map((r) => {
        const contact = initialContacts.find((p) => p.name === r.name);
        return `- ${r.name}: ${contact?.prompt || "Just be yourself."}`;
      })
      .join("\n");

    // Build the prompt
    const prompt = isOneOnOne
      ? buildOneOnOnePrompt(recipients[0], conversation, state)
      : buildGroupPrompt(recipients, participantDescriptions, conversationReversed, state);

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];

    // Define tools based on chat type
    const participantNames = recipients.map((r) => r.name);
    const tools = isOneOnOne
      ? buildOneOnOneTools(recipients[0].name)
      : buildGroupTools(participantNames, state.lastSpeaker);

    const response = await getClient().chat.completions.create({
      model: "gpt-5.2",
      messages: chatMessages,
      tool_choice: "required",
      tools,
      parallel_tool_calls: false,
      temperature: 0.7,
      max_tokens: 500,
    });

    const toolCalls = response.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      console.error("No tool calls in response. Message:", JSON.stringify(response.choices[0]?.message, null, 2));
      return new Response(
        JSON.stringify({ actions: [{ action: "wait" }] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Return all actions (supports react + respond in same turn)
    const actions = toolCalls.map((tc) => {
      const args = JSON.parse(tc.function.arguments || "{}");
      return {
        action: tc.function.name,
        ...args,
      };
    });

    return new Response(
      JSON.stringify({ actions }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate message",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function buildOneOnOnePrompt(
  recipient: Recipient,
  conversation: string,
  state: { lastHumanMessage: string | null; lastHumanTime: string | null }
): string {
  const contact = initialContacts.find((p) => p.name === recipient.name);
  const persona = contact?.prompt || "Just be yourself and keep it casual.";

  return `You are ${recipient.name} in a 1-on-1 text conversation with a human ("me").

${persona}

CONVERSATION:
${conversation || "(no messages yet)"}

STATE:
- Last human message: "${state.lastHumanMessage || "(none)"}" (${state.lastHumanTime || "n/a"})

Respond naturally. Keep it SHORT like a real text message (1-2 sentences, not paragraphs).`;
}

function buildGroupPrompt(
  recipients: Recipient[],
  participantDescriptions: string,
  conversationReversed: { mostRecent: string | null; history: string },
  state: {
    messagesSinceHuman: number;
    lastHumanMessage: string | null;
    lastHumanTime: string | null;
    lastSpeaker: string | null;
  }
): string {
  const participantNames = recipients.map(r => r.name).join(", ");

  return `You are participating in a group chat with ${participantNames} and one other random, anonymous person (labeled "anon" in the conversation history below, but don't call them that - just talk to them naturally without using any name).

PERSONAS:
${participantDescriptions}

MOST RECENT MESSAGE:
${conversationReversed.mostRecent || "(no messages yet)"}

CONVERSATION HISTORY (newest first):
${conversationReversed.history || "(no prior messages)"}

STATE:
- Messages since anon last spoke: ${state.messagesSinceHuman}
- Last speaker: ${state.lastSpeaker === "me" ? "anon" : state.lastSpeaker || "none"}

Based on the most recent message and the conversation history, determine the best next action(s). You can combine actions (e.g. react AND respond).

HOW TO DECIDE:
- react: React to a message when you feel strongly about it. Laugh if it's really funny, heart if you love what they said, question if you don't understand. Use reactions sparingly - only about 1 in 5 messages should get a reaction. You can react and respond in the same turn if you do react.
- respond: Respond when a question or comment is directed at one of the participants (e.g. "hey Sarah, what do you think?"). Keep the conversation engaging and light, based on what your chosen persona would actually say. Remember it's a texting convo - keep messages brief unless asked for a longer response. Don't be repetitive - don't repeat yourself or other members of the chat. Move the convo forward. Participants should talk to each other, not just to anon - ask each other questions, riff on what others said, build on the conversation naturally like real friends would.
- wait: Wait if the most recent message is directed at anon (the human user) - let them respond. Also wait if the message didn't ask anything or require a response.
- wrap_up: Wrap up if we haven't seen a message from anon in 3+ messages. Bring the conversation to a natural, friendly end.`;
}

/**
 * Build tools for 1:1 chats.
 * Only react and respond are needed - 1:1 chats are naturally turn-based
 * (user sends message, AI responds). No wait/wrap_up needed since the AI
 * should always respond when the user messages them directly.
 */
function buildOneOnOneTools(recipientName: string) {
  return [
    {
      type: "function" as const,
      function: {
        name: "react",
        description: "React to the last message without saying anything. Use sparingly.",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: [recipientName],
            },
            reaction: {
              type: "string",
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
              description: "'laugh' for funny, 'heart' for touching, 'like' for agree, 'emphasize' for important",
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
        description: "Send a message in the conversation",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: [recipientName],
            },
            message: {
              type: "string",
              description: "Keep it SHORT (1-2 sentences). Casual like friends texting.",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
  ];
}

function buildGroupTools(participantNames: string[], lastSpeaker: string | null) {
  // Filter out the last speaker from eligible participants (they shouldn't speak twice in a row)
  const eligibleSpeakers = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter(name => name !== lastSpeaker)
    : participantNames;

  return [
    {
      type: "function" as const,
      function: {
        name: "react",
        description: "Add an emoji reaction to the last message (no text).",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: participantNames,
            },
            reaction: {
              type: "string",
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
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
        description: "Send a short text message (1-2 sentences).",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
            },
            message: {
              type: "string",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "wait",
        description: "Stay silent and let anon respond.",
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
        description: "End conversation with a brief friendly closing.",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
            },
            message: {
              type: "string",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
  ];
}
