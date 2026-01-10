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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      recipients: recipientsRaw,
      messages: messagesRaw,
      shouldWrapUp = false,
      isOneOnOne: isOneOnOneRaw = false,
      shouldReact = false,
    } = body as Record<string, unknown>;

    if (!Array.isArray(recipientsRaw) || recipientsRaw.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid recipients" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const recipients = recipientsRaw as Recipient[];
    const messages = (Array.isArray(messagesRaw) ? messagesRaw : []) as Message[];
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
    `
    }
    
    Quick tips:
    ${
      isOneOnOne
        ? `
    - One message only
    - Keep it personal
    - Flow naturally
    `
        : `
    ${
      shouldReact
        ? `- You must react to the last message
        - If you love the last message, react with "heart" 
        - If you like the last message, react with "like"
        - If the last message was funny, react with "laugh"
        - If you strongly agree with the last message, react with "emphasize"`
        : ""
    }    
    - One quick message
    - Pick someone who hasn't talked in a bit
    - Don't refer to the user as "me" - you can ask their name if you want
    - If someone specific was tagged or asked a question, reply as them
    - Review the previous messages in the conversation
    - DO NOT repeat yourself or other participants
    - Advance the conversation by asking questions
    - DO NOT contradict your previous statements
    - Share original insights and hot takes that may be controversial
    - Keep messages short (fewer than 20 words)
    - No emojis or weird formatting

    ${
      shouldWrapUp
        ? `
    - This is the last message
    - Don't ask a question to another recipient unless it's to "me" the user`
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
      model: "gpt-4o-mini",
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
                  enum: sortedParticipants.map((r: Recipient) => r.name),
                },
                content: { type: "string" },
                reaction: {
                  type: "string",
                  enum: ["heart", "like", "dislike", "laugh", "emphasize"],
                  description: "optional reaction to the last message",
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
