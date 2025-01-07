import { OpenAI } from "openai";
import { Recipient, Message, ReactionType } from "../../../types";
import { techPersonalities } from "../../../data/tech-personalities";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";

const client = wrapOpenAI(
  new OpenAI({
    baseURL: "https://api.braintrust.dev/v1/proxy",
    apiKey: process.env.BRAINTRUST_API_KEY!,
    timeout: 30000,
    maxRetries: 3,
  })
);

initLogger({
  projectName: "dialogue",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

interface ChatResponse {
  sender: string;
  content: string;
  reaction?: ReactionType;
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    recipients,
    messages,
    shouldWrapUp,
    isFirstMessage,
    isOneOnOne,
    shouldReact,
  } = body;

  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1] : null;
  const lastAiMessage = messages
    ?.slice()
    .reverse()
    .find((m: Message) => m.sender !== "me");

  // Find consecutive user messages
  let consecutiveUserMessages = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "me") {
      consecutiveUserMessages++;
    } else {
      break;
    }
  }

  const wasInterrupted =
    consecutiveUserMessages > 0 &&
    lastAiMessage &&
    messages.indexOf(lastAiMessage) ===
      messages.length - (consecutiveUserMessages + 1);

  const availableParticipants = recipients.filter(
    (r: Recipient) => r.name !== lastMessage?.sender
  );

  // Count consecutive messages from each participant
  const recentMessages = messages?.slice(-4) || [];
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
        techPersonalities.find((p) => p.name === recipients[0].name)?.prompt) ||
      "Just be yourself and keep it casual."
    }
    `
        : `
    You're in a text messagegroup chat with a human user ("me") and: ${recipients
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
        const personality = techPersonalities.find((p) => p.name === r.name);
        return personality
          ? `${r.name}: ${personality.prompt}`
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
        - If you like what the user said, react with "heart" or "like"
        - If you thought the last message was funny, react with "laugh"
        - If you agree with the last message, react with "emphasize"`
        : ""
    }    
    - One quick message
    - Pick someone who hasn't talked in a bit
    - If user tagged someone specific, only reply if you're them
    - Make it personal if replying to user
    - Keep it short and chatty (fewer than 20 words)
    - Skip the emojis or weird formatting
    - Don't repeat yourself
    - Keep the convo moving
    - Don't talk in circles, start a new topic
    ${
      shouldWrapUp
        ? `
    - This is the last message
    - Don't ask a question to another recipient unless it's to "me" the user`
        : ""
    }
    ${
      isFirstMessage
        ? `
    - This is the first message in the group chat
    - Ask a question or make a statement that gets the group talking`
        : ""
    }
    `
    }
  `;

  try {
    const openaiMessages = [
      { role: "system", content: prompt },
      ...(messages || []).map((msg: Message) => ({
        role: "user",
        content: `${msg.sender}: ${msg.content}${
          msg.reactions?.length
            ? ` [reactions: ${msg.reactions
                .map((r) => `${r.sender} reacted with ${r.type}`)
                .join(", ")}]`
            : ""
        }`,
      })),
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...openaiMessages],
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
                  enum: [
                    "heart",
                    "like",
                    "dislike",
                    "laugh",
                    "emphasize",
                  ],
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

    console.log("Full OpenAI response:", JSON.stringify(response, null, 2));

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

    console.log("Extracted content:", content);

    if (!content) {
      console.log("Response structure:", {
        hasChoices: Boolean(response.choices),
        firstChoice: response.choices?.[0],
        hasMessage: Boolean(response.choices?.[0]?.message),
        toolCalls: response.choices?.[0]?.message?.tool_calls,
      });
      throw new Error("No response from OpenAI");
    }

    let messageData: ChatResponse;
    try {
      messageData = JSON.parse(content.trim()) as ChatResponse;
      console.log("Parsed message data:", messageData);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON format in API response");
    }

    // Handle special case for "me" sender
    if (messageData.sender === "me" && sortedParticipants.length > 0) {
      messageData.sender = sortedParticipants[0].name;
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
