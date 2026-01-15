import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Recipient, Message, ReactionType } from "@/types/messages";
import { initialContacts } from "@/data/messages/initial-contacts";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";

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

interface ChatResponse {
  sender: string;
  content: string;
  reaction?: ReactionType;
}

// Extract questions already asked to prevent repetition
function getAskedQuestions(messages: Message[]): string[] {
  return messages
    .filter(m => m.content.includes('?') && m.sender !== 'me' && m.sender !== 'system')
    .map(m => `- "${m.content.split('?')[0]}?" (${m.sender})`)
    .slice(-5);
}

// Extract recent topics discussed
function getRecentTopics(messages: Message[]): string[] {
  return messages
    .filter(m => m.sender !== 'system')
    .slice(-6)
    .map(m => `- ${m.sender}: "${m.content.substring(0, 50)}${m.content.length > 50 ? '...' : ''}"`)
}

// Count reactions in recent messages to avoid over-reacting
function getRecentReactionCount(messages: Message[], lookback: number = 5): number {
  return messages
    .slice(-lookback)
    .filter(m => m.reactions && m.reactions.length > 0)
    .length;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      recipients: recipientsRaw,
      messages: messagesRaw,
      shouldWrapUp = false,
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
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const messages = (Array.isArray(messagesRaw) ? messagesRaw : []).filter(
      isMessageLike
    );
    const isOneOnOneRequested = isOneOnOneRaw === true;
    const isOneOnOne = isOneOnOneRequested && recipients.length === 1;
    if (isOneOnOneRequested && recipients.length !== 1) {
      return new Response(
        JSON.stringify({
          error: "Invalid recipients for one-on-one chat (expected exactly 1)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastAiMessage = messages
      .slice()
      .reverse()
      .find((m: Message) => m.sender !== "me");

    // Find consecutive user messages
    let consecutiveUserMessages = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.sender === "me") {
        consecutiveUserMessages++;
      } else {
        break;
      }
    }

    const wasInterrupted =
      consecutiveUserMessages > 0 &&
      !!lastAiMessage &&
      messages.indexOf(lastAiMessage) ===
        messages.length - (consecutiveUserMessages + 1);

    const availableParticipants = recipients.filter(
      (r: Recipient) => r.name !== lastMessage?.sender
    );

    // Count consecutive messages from each participant
    const recentMessages = messages.slice(-4);
    const participantCounts = new Map<string, number>();
    for (const msg of recentMessages) {
      if (msg.sender !== "me") {
        participantCounts.set(
          msg.sender,
          (participantCounts.get(msg.sender) || 0) + 1
        );
      }
    }

    // Prioritize participants who haven't spoken recently
    const sortedParticipants = availableParticipants.sort(
      (a: Recipient, b: Recipient) => {
        const aCount = participantCounts.get(a.name) || 0;
        const bCount = participantCounts.get(b.name) || 0;
        return aCount - bCount;
      }
    );

    // For one-on-one chats, always use the single recipient as the sender
    // For group chats, use the sorted available participants
    const senderCandidates = isOneOnOne ? recipients : sortedParticipants;

    // Validate that we have at least one sender candidate
    if (senderCandidates.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No available participants to send a message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `
    ${
      isOneOnOne
        ? `
    You're chatting 1-on-1 text message convo with a human user ("me"). You are responding as ${
      recipients[0].name
    }.
    ${
      (recipients[0].name &&
        initialContacts.find((p) => p.name === recipients[0].name)?.prompt) ||
      "Just be yourself and keep it casual."
    }
    `
        : `
    You're in a text message group chat with a human user ("me") and: ${recipients
      .map((r: Recipient) => r.name)
      .join(", ")}.
    You'll be one of these people for your next msg: ${sortedParticipants
      .map((r: Recipient) => r.name)
      .join(", ")}.

    ${
      wasInterrupted
        ? `
    The user jumped into the conversation with something new. Make sure to:
    - Acknowledge it naturally
    - Address what they said
    - Go with the new flow
    `
        : ""
    }
    Match your character's style:
    ${sortedParticipants
      .map((r: Recipient) => {
        const contact = initialContacts.find((p) => p.name === r.name);
        return contact
          ? `${r.name}: ${contact.prompt}`
          : `${r.name}: Just be yourself.`;
      })
      .join("\n")}

=== CONVERSATION CONTEXT ===
Recent messages:
${getRecentTopics(messages).join('\n') || '(none yet)'}

Questions already asked (DO NOT ask these again):
${getAskedQuestions(messages).join('\n') || '(none yet)'}

Recent reactions in conversation: ${getRecentReactionCount(messages)} in last 5 messages
    `
    }

    Quick tips:
    ${
      isOneOnOne
        ? `
    - One message only
    - Keep it personal
    - Flow naturally
    - REACTIONS: Maybe 1 in 10 messages. Only react if the message stands out:
      - "laugh" for something funny
      - "heart" for something sweet
      - Skip if there's been a reaction recently
    `
        : `
=== CRITICAL RULES ===
1. NEVER repeat or rephrase any question listed above
2. NEVER make a statement that echoes what someone else already said
3. Say something NEW and DIFFERENT - add fresh perspective or topic
4. If you can't think of something new, make a brief observation instead
5. Keep messages SHORT (under 15 words)
6. If someone specific was asked a question, respond as them
7. No emojis or weird formatting

=== REACTIONS ===
- Maybe 1 in 10 messages - only for messages that stand out
- Skip if there's been a reaction recently
- "laugh" for something funny, "heart" for something sweet, "emphasize" for an important point

${
      shouldWrapUp
        ? `
=== WRAP UP NATURALLY ===
- Don't ask any questions that need a response
- A statement, observation, or agreement works well
- Don't say goodbye or announce you're leaving - just let the conversation settle`
        : ""
    }
    `
    }
  `;

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system" as const, content: prompt },
      ...messages.map((msg: Message) => ({
        role: "user" as const,
        content: `${msg.sender}: ${msg.content}${
          msg.reactions?.length
            ? ` [reactions: ${msg.reactions
                .map((r) => `${r.sender} reacted with ${r.type}`)
                .join(", ")}]`
            : ""
        }`,
      })),
    ];

    const response = await getClient().chat.completions.create({
      model: "gpt-5.2",
      messages: [...chatMessages],
      tool_choice: "required",
      tools: [
        {
          type: "function",
          function: {
            name: "chat",
            description: "returns the next message in the conversation",
            parameters: {
              type: "object",
              properties: {
                sender: {
                  type: "string",
                  enum: senderCandidates.map((r: Recipient) => r.name),
                },
                content: { type: "string" },
                reaction: {
                  type: "string",
                  enum: ["heart", "like", "dislike", "laugh", "emphasize"],
                  description: "Optional - maybe 1 in 10 messages. Only include for messages that genuinely stand out.",
                },
              },
              required: ["sender", "content"],
            },
          },
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    let content =
      response.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;

    // If no tool calls, try to parse from direct content
    if (!content && response.choices[0]?.message?.content) {
      const messageContent = response.choices[0].message.content;
      const match = messageContent.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        content = JSON.stringify({
          sender: match[1].trim(),
          content: match[2].trim(),
        });
      }
    }

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let messageData: ChatResponse;
    try {
      messageData = JSON.parse(content.trim()) as ChatResponse;
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON format in API response");
    }

    return new Response(JSON.stringify(messageData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate message",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
