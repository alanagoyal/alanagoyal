import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Recipient, Message, ReactionType } from "@/types/messages";
import { initialContacts } from "@/data/messages/initial-contacts";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";
import {
  formatConversation,
  getConversationState,
  getParticipantContributions,
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
      recentWaitCount: recentWaitCountRaw = 0,
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
    const recentWaitCount = typeof recentWaitCountRaw === "number" ? recentWaitCountRaw : 0;

    // Get conversation state
    const state = getConversationState(messages);
    const conversation = formatConversation(messages);

    // Build participant descriptions
    const participantDescriptions = recipients
      .map((r) => {
        const contact = initialContacts.find((p) => p.name === r.name);
        return `- ${r.name}: ${contact?.prompt || "Just be yourself."}`;
      })
      .join("\n");

    // Get participant contributions for self-awareness
    const participantNames = recipients.map((r) => r.name);
    const contributions = getParticipantContributions(messages, participantNames);

    // Build the prompt
    const prompt = isOneOnOne
      ? buildOneOnOnePrompt(recipients[0], conversation, state)
      : buildGroupPrompt(recipients, participantDescriptions, conversation, state, contributions, recentWaitCount);

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];

    // Define tools based on chat type
    const tools = isOneOnOne
      ? buildOneOnOneTools(recipients[0].name)
      : buildGroupTools(participantNames, state.messagesSinceHuman, state.lastSpeaker, recentWaitCount);

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      tool_choice: "required",
      tools,
      parallel_tool_calls: false,
      temperature: 0.7,
      max_tokens: 150,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response. Message:", JSON.stringify(response.choices[0]?.message, null, 2));
      // Fallback: if model refused to use tools, default to wait
      return new Response(
        JSON.stringify({ action: "wait" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const action = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments || "{}");

    return new Response(
      JSON.stringify({ action, ...args }),
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
  conversation: string,
  state: {
    messagesSinceHuman: number;
    lastHumanMessage: string | null;
    lastHumanTime: string | null;
    lastSpeaker: string | null;
  },
  contributions: Map<string, string[]>,
  recentWaitCount: number
): string {
  const participantNames = recipients.map(r => r.name).join(", ");

  // Detect if this looks like a thread reset (greeting after gap)
  const isGreeting = state.lastHumanMessage &&
    /^(hey|hi|hello|yo|sup|what'?s up|howdy)[\s!?.]*$/i.test(state.lastHumanMessage.trim());
  const hadPriorConversation = state.messagesSinceHuman > 0 ||
    Array.from(contributions.values()).some(msgs => msgs.length > 0);
  const isThreadReset = isGreeting && hadPriorConversation;

  // Build explicit "what each person just said" section - this is critical for avoiding repetition
  const recentContributions = Array.from(contributions.entries())
    .map(([name, msgs]) => {
      if (msgs.length === 0) {
        return `• ${name}: (hasn't spoken yet)`;
      }
      const lastMsg = msgs[msgs.length - 1];
      const truncated = lastMsg.length > 80 ? lastMsg.substring(0, 80) + "..." : lastMsg;
      return `• ${name}: "${truncated}"`;
    })
    .join("\n");

  // Determine action guidance
  let actionGuidance = "";
  if (state.messagesSinceHuman >= 3) {
    actionGuidance = `\n⚠️ ${state.messagesSinceHuman} AI messages since human spoke. Use WAIT or WRAP_UP now.`;
  } else if (recentWaitCount >= 2) {
    actionGuidance = `\n⚠️ You've waited ${recentWaitCount} times. Use WRAP_UP now.`;
  }

  return `You are ${participantNames} in a group text with a human ("me").

PERSONAS:
${participantDescriptions}

CONVERSATION:
${conversation || "(empty)"}

═══════════════════════════════════════════════════
WHAT EACH PARTICIPANT JUST SAID (DO NOT REPEAT):
${recentContributions}
═══════════════════════════════════════════════════

CURRENT STATE:
• Human said: "${state.lastHumanMessage || "(none)"}" (${state.lastHumanTime || "n/a"})
• AI messages since: ${state.messagesSinceHuman}
• Last speaker: ${state.lastSpeaker || "none"}${isThreadReset ? "\n• Fresh greeting - new thread" : ""}${actionGuidance}

RULES:
1. NEVER repeat or paraphrase what's shown above - say something NEW or use wait/wrap_up
2. Short messages only (1-2 sentences)
3. After 2-3 AI messages, use wait or wrap_up
4. If human said "hi/hey", ONE brief response then wait

ACTIONS: react, respond, wait, wrap_up`;
}

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

function buildGroupTools(participantNames: string[], messagesSinceHuman: number, lastSpeaker: string | null, recentWaitCount: number) {
  // Filter out the last speaker from eligible participants (they shouldn't speak twice in a row)
  const eligibleSpeakers = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter(name => name !== lastSpeaker)
    : participantNames;

  // Dynamic context for tool descriptions
  const shouldEncourageWrapUp = recentWaitCount >= 2 || messagesSinceHuman >= 4;

  return [
    {
      type: "function" as const,
      function: {
        name: "react",
        description: "Add an emoji reaction to the last message (no text). Use sparingly.",
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
        description: shouldEncourageWrapUp
          ? "Stay silent. You've waited before - consider wrap_up instead."
          : "Stay silent and let the human respond.",
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
        description: shouldEncourageWrapUp
          ? "End with a brief friendly closing. Recommended now."
          : "End conversation with a brief friendly closing.",
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
