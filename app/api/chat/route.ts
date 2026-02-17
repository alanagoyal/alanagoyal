import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { Recipient, Message } from "@/types/messages";
import { initialContacts } from "@/data/messages/initial-contacts";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";
import {
  formatConversation,
  formatConversationReversed,
  getConversationState,
} from "@/lib/messages/temporal-context";

// Keep route execution under strict serverless limits (for example 15s).
export const maxDuration = 14;

let client: OpenAI | null = null;
let loggerInitialized = false;
const CHAT_REQUEST_TIMEOUT_MS = 9000;

function parseToolCallArguments(
  rawArguments: string | undefined,
  functionName: string
): Record<string, unknown> {
  if (!rawArguments) return {};
  try {
    const parsed = JSON.parse(rawArguments);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn(
      `Failed to parse tool arguments for ${functionName}:`,
      error
    );
    return {};
  }
}

function getClient() {
  if (!client) {
    client = wrapOpenAI(
      new OpenAI({
        baseURL: "https://api.braintrust.dev/v1/proxy",
        apiKey: process.env.BRAINTRUST_API_KEY!,
        // Fail fast and let MessageQueue retry once on the client side.
        timeout: 12000,
        maxRetries: 0,
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

function isQuotaError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 429) return true;
  if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "insufficient_quota") return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("429") || message.includes("quota") || message.includes("rate limit");
}

function isTransientUpstreamError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("abort") ||
    message.includes("aborted") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("504") ||
    message.includes("gateway") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

function hasChoices(
  value: unknown
): value is { choices: Array<{ message?: { tool_calls?: ChatCompletionMessageToolCall[] } }> } {
  return typeof value === "object" && value !== null && "choices" in value;
}

async function createChatCompletionWithTimeout(
  params: Parameters<OpenAI["chat"]["completions"]["create"]>[0],
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(`chat upstream timeout after ${timeoutMs}ms`);
  }, timeoutMs);
  try {
    return await getClient().chat.completions.create(params, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
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

    const response = await createChatCompletionWithTimeout(
      {
        model: "gpt-5.2",
        messages: chatMessages,
        tool_choice: "required",
        tools,
        stream: false,
        parallel_tool_calls: false,
        temperature: 0.7,
        max_tokens: 300,
      },
      CHAT_REQUEST_TIMEOUT_MS
    );
    if (!hasChoices(response)) {
      throw new Error("Unexpected streaming response from chat completions API");
    }

    const toolCalls = response.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      console.error("No tool calls in response. Message:", JSON.stringify(response.choices[0]?.message, null, 2));
      return new Response(
        JSON.stringify({ actions: [{ action: "wait" }] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Return all actions (supports react + respond in same turn)
    const actions = toolCalls.map((tc: ChatCompletionMessageToolCall) => {
      const args = parseToolCallArguments(
        tc.function.arguments,
        tc.function.name
      );
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

    if (isQuotaError(error)) {
      return new Response(
        JSON.stringify({
          error: "API quota exceeded",
          code: "quota_exceeded",
          details: "The AI API quota has been exceeded. Messages will not receive replies until the quota resets.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Degrade gracefully on transient upstream failures so the UI keeps working
    // instead of surfacing a hard error from /api/chat.
    if (isTransientUpstreamError(error)) {
      return new Response(
        JSON.stringify({
          actions: [{ action: "wait" }],
          degraded: true,
          reason: "upstream_unavailable",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

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

RULES:
1. You're texting. 1-2 sentences MAX. No paragraphs. Be casual.
2. Don't repeat things you've already said in this conversation. Keep it fresh.

Respond naturally like a real text.`;
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

  // Stepped cadence guidance based on how many AI messages since the human last spoke
  let cadenceGuidance: string;
  if (state.messagesSinceHuman === 0) {
    cadenceGuidance = "The human just spoke. Respond naturally.";
  } else if (state.messagesSinceHuman <= 2) {
    cadenceGuidance = "A couple messages since the human spoke. Respond if you're addressed or have something genuinely NEW to add. Don't repeat what was already said.";
  } else {
    cadenceGuidance = "Several AI messages in a row. Only respond if directly addressed (e.g. someone asked you a question). Otherwise use `wait` or `wrap_up`.";
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
5. WAIT: ONLY use wait when anon (the human) specifically needs to respond. If a question is directed at another AI participant, that participant should respond, not wait.
6. WRAP UP: If 3+ messages have passed without anon speaking, use wrap_up to end things naturally.

Pick the best action(s).`;
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
        description: "React to the last message WITHOUT saying anything. Use this when you want to ONLY react (no text reply).",
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
        description: "Send text messages. Optionally react to the last message at the same time.",
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: [recipientName],
            },
            messages: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 3,
              description: "1-3 short texts, like real iMessage. Each should be 1 sentence. Split separate thoughts into separate messages.",
            },
            reaction: {
              type: "string",
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
              description: "Optional: also react to the last message before responding. Use when something genuinely warrants it.",
            },
          },
          required: ["participant", "messages"],
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

  // Filter out the last message sender from react participants (no self-reactions)
  const eligibleReactors = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter(name => name !== lastSpeaker)
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
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
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
        description: "Stay silent. ONLY use this when anon (the human) specifically needs to respond — e.g. a question was directed at them. Do NOT wait if another participant asked an AI participant a question.",
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
