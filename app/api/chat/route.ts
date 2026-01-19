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
      : buildGroupPrompt(recipients, participantDescriptions, conversation, state, contributions);

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];

    // Define tools based on chat type
    const tools = isOneOnOne
      ? buildOneOnOneTools(recipients[0].name)
      : buildGroupTools(participantNames, state.messagesSinceHuman, state.lastSpeaker);

    const response = await getClient().chat.completions.create({
      model: "gpt-5.2",
      messages: chatMessages,
      tool_choice: "required",
      tools,
      temperature: 0.7,
      max_tokens: 150,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
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
  contributions: Map<string, string[]>
): string {
  // Determine urgency level for wrap-up
  const shouldWrapUp = state.messagesSinceHuman >= 3;
  const mustWrapUp = state.messagesSinceHuman >= 5;

  let actionGuidance = "";
  if (mustWrapUp) {
    actionGuidance = `
ACTION REQUIRED: There have been ${state.messagesSinceHuman} AI messages without human response.
You MUST use wrap_up to end this thread gracefully, or wait to give the human space.
Do NOT use speak - the human needs a chance to respond.`;
  } else if (shouldWrapUp) {
    actionGuidance = `
NOTE: There have been ${state.messagesSinceHuman} AI messages since the human last spoke.
Strongly consider using wait or wrap_up rather than continuing to speak.`;
  }

  // Build self-awareness section - what has each participant already said?
  const contributionsSummary = Array.from(contributions.entries())
    .map(([name, msgs]) => {
      if (msgs.length === 0) {
        return `- ${name}: Has not spoken yet in this thread`;
      }
      const lastMsg = msgs[msgs.length - 1];
      const truncated = lastMsg.length > 100 ? lastMsg.substring(0, 100) + "..." : lastMsg;
      return `- ${name}: Said ${msgs.length} message(s). Last message: "${truncated}"`;
    })
    .join("\n");

  // Guidance based on who just spoke
  let speakerGuidance = "";
  if (state.lastSpeaker && state.lastSpeaker !== "me") {
    speakerGuidance = `\n⚠️ ${state.lastSpeaker} just spoke. A different participant should speak next, or use wait/wrap_up.`;
  }

  return `You are participating in a group text chat.

PARTICIPANTS:
- me (human)
${participantDescriptions}

This is a shared conversational space. AI participants may speak to each other as well as to the human. The human is a participant, not a moderator.

CONVERSATION:
${conversation || "(no messages yet)"}

WHAT EACH PARTICIPANT HAS SAID (for self-awareness - DO NOT REPEAT):
${contributionsSummary}

STATE:
- Last speaker: ${state.lastSpeaker || "none"}${speakerGuidance}
- Last human message: "${state.lastHumanMessage || "(none)"}" (${state.lastHumanTime || "n/a"})
- Messages since human last spoke: ${state.messagesSinceHuman}
${actionGuidance}

CRITICAL RULES:
1. Do NOT repeat what you or others have already said
2. Do NOT ask the same question someone already asked (e.g., "what are you building?")
3. Do NOT use generic greetings like "yo", "hey", "fresh start" if someone else already greeted
4. Do NOT start with "[Name]'s right" or "I agree with [Name]" - just say your piece naturally
5. Use VARIED reactions that match the message: laugh for funny, heart for touching, like for agree - don't just use emphasize for everything
6. Talk like casual friends texting, not like a panel discussion or formal debate
7. If you just spoke, use wait to let others talk
8. After 2-3 AI messages without human response, prefer wait or wrap_up

GUIDELINES:
- Talk like friends in a group text - casual, natural, no formalities
- Keep messages SHORT like real texts (1-2 sentences max)
- You can disagree, joke around, or go on tangents - that's what friends do
- Don't be a panel of experts agreeing with each other - be real people chatting
- If the human returns with a greeting after a gap, ONE AI greets back, then wait

Choose your action: speak, wait, or wrap_up.`;
}

function buildOneOnOneTools(recipientName: string) {
  return [
    {
      type: "function" as const,
      function: {
        name: "speak",
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
              description: "Your message",
            },
            reaction: {
              type: "string",
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
              description: "Only if warranted: 'laugh' for funny, 'heart' for touching, 'like' for agree, 'emphasize' for important, 'dislike' for disagree, 'question' for confused. Don't react to every message.",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
  ];
}

function buildGroupTools(participantNames: string[], messagesSinceHuman: number, lastSpeaker: string | null) {
  // Filter out the last speaker from eligible participants (they shouldn't speak twice in a row)
  const eligibleSpeakers = lastSpeaker && lastSpeaker !== "me"
    ? participantNames.filter(name => name !== lastSpeaker)
    : participantNames;

  const lastSpeakerNote = lastSpeaker && lastSpeaker !== "me"
    ? ` ${lastSpeaker} just spoke, so pick someone else.`
    : "";

  const speakDescription = messagesSinceHuman >= 5
    ? "Send a message. WARNING: There have been many AI messages without human response. Prefer wait or wrap_up instead."
    : messagesSinceHuman >= 3
    ? `Send a message. Note: Consider if the human needs space to respond.${lastSpeakerNote}`
    : `Send a message as one of the AI participants. Only use if you have something new and substantive to add.${lastSpeakerNote}`;

  const waitDescription = messagesSinceHuman >= 3
    ? "RECOMMENDED: Stay silent and give the human a chance to respond. Use this when AI participants have been talking and the human hasn't had a chance to jump in."
    : "Stay silent and let someone else continue. Use when the conversation has a natural pause, the ground has been covered, or the human might want to jump in.";

  const wrapUpDescription = messagesSinceHuman >= 5
    ? "RECOMMENDED: Send a brief closing message and end the thread gracefully. The human hasn't responded to several messages - time to wrap up."
    : "Send a final message and signal the conversation is winding down. Use when the discussion has reached a natural conclusion or there have been several AI messages without human input.";

  return [
    {
      type: "function" as const,
      function: {
        name: "speak",
        description: speakDescription,
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
              description: `Who is speaking.${lastSpeakerNote}`,
            },
            message: {
              type: "string",
              description: "Your message. Keep it SHORT (1-2 sentences). Talk casually like friends texting. Don't start with 'X is right' or 'I agree' - just say your piece.",
            },
            reaction: {
              type: "string",
              enum: ["heart", "like", "dislike", "laugh", "emphasize", "question"],
              description: "Only if warranted: 'laugh' for funny, 'heart' for touching, 'like' for agree, 'emphasize' for important, 'dislike' for disagree, 'question' for confused. Don't react to every message.",
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
        description: waitDescription,
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
        description: wrapUpDescription,
        parameters: {
          type: "object",
          properties: {
            participant: {
              type: "string",
              enum: eligibleSpeakers.length > 0 ? eligibleSpeakers : participantNames,
              description: `Who is speaking the final message.${lastSpeakerNote}`,
            },
            message: {
              type: "string",
              description: "A brief concluding thought - NOT a question. Something like 'Anyway, good chatting!' or 'Let us know what you end up building!'",
            },
          },
          required: ["participant", "message"],
        },
      },
    },
  ];
}
