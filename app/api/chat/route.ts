import { OpenAI } from "openai";
import { Recipient, Message } from "../../../types";
import { techPersonalities } from "../../../data/tech-personalities";
import { wrapOpenAI } from "braintrust";
import { initLogger } from "braintrust";

const client = wrapOpenAI(
  new OpenAI({
    baseURL: "https://api.braintrust.dev/v1/proxy",
    apiKey: process.env.BRAINTRUST_API_KEY!,
    timeout: 30000, // 30 second timeout
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
}

function findMatchingParticipant(
  partialName: string,
  participants: Recipient[]
): string | null {
  // First try exact match (case insensitive)
  const exactMatch = participants.find(
    (p) => p.name.toLowerCase() === partialName.toLowerCase()
  );
  if (exactMatch) return exactMatch.name;

  // Then try partial match (case insensitive)
  const partialMatch = participants.find(
    (p) =>
      p.name.toLowerCase().includes(partialName.toLowerCase()) ||
      partialName.toLowerCase().includes(p.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.name;

  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { recipients, messages, shouldWrapUp, isFirstMessage, isOneOnOne } =
    body;

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
    You're chatting 1-on-1 with a human user. You're ${recipients[0].name}.
    ${
      (recipients[0].name &&
        techPersonalities.find((p) => p.name === recipients[0].name)?.prompt) ||
      "Just be yourself and keep it casual."
    }
    `
        : `
    You're in a group chat with "me" and: ${recipients
      .map((r: Recipient) => r.name)
      .join(", ")}.
    You'll be one of these people for your next msg: ${sortedParticipants
      .map((r: Recipient) => r.name)
      .join(", ")}.

    ${
      wasInterrupted
        ? `
    Heads up: The user ${
      consecutiveUserMessages > 1 ? "sent some messages" : "jumped in"
    } with something new. Make sure to:
    - Acknowledge it naturally
    - Address what they said
    - Go with the new flow
    `
        : ""
    }
    
    Quick personality notes:
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
    
    Keep it natural and match your character's vibe.
    
    IMPORTANT: 
    1. Reply in this exact JSON:
    {
      "sender": "name_of_participant",
      "content": "your_message"
    }
    2. ${
      isOneOnOne
        ? `You have to be "${recipients[0].name}"`
        : `Pick from these names: ${sortedParticipants
            .map((r: Recipient) => r.name)
            .join(", ")}`
    }
    3. Don't use "me" as sender
    
    Quick tips:
    ${
      isOneOnOne
        ? `
    - One message only
    - Keep it personal
    - Flow naturally
    `
        : `
    - One quick message
    - Pick someone who hasn't talked in a bit
    - If user tagged someone specific, only reply if you're them
    - Match your character's style
    - Keep it short and chatty
    - Your response should be at most 20 words
    - Skip the emojis
    - Only use names when it feels right
    - Make it personal if replying to user
    - Keep the convo moving
    - Be fun/spontaneous when it fits
    - Don't repeat yourself
    - Skip quotes/formatting
    - If someone already answered the user, start a new topic
    - Don't answer stuff meant for others
    ${
      shouldWrapUp
        ? `
    - This is the last message. 
    - Don't ask a question to another recipient unless it's to "me" the user.`
        : ""
    }
    ${
      isFirstMessage
        ? `
    - This is the first message in the group chat.
    - Ask a question or make a statement that gets the group talking.`
        : ""
    }`
    }
  `;

  try {
    const openaiMessages = [
      { role: "system", content: prompt },
      ...(messages || []).map((msg: Message) => ({
        role: "user",
        content: `${msg.sender}: ${msg.content}`,
      })),
    ];

    const response = await client.chat.completions.create({
      model: "claude-3-5-sonnet-latest",
      messages: [
        ...openaiMessages,
        {
          role: "system",
          content: `You must respond with valid JSON in the following format ONLY:\n{"sender": "<n>", "content": "<message>"}\nThe sender MUST be one of these exact names: ${sortedParticipants
            .map((r: Recipient) => `"${r.name}"`)
            .join(", ")}`,
        },
      ],
      temperature: 0.9,
      max_tokens: 1000, // Increased to prevent truncation
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let messageData: ChatResponse;
    try {
      // Parse the JSON response
      messageData = JSON.parse(content.trim()) as ChatResponse;

      if (!messageData.sender || !messageData.content) {
        throw new Error("Response missing required fields");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          "Failed to parse JSON response:",
          error,
          "\nContent preview:",
          content.slice(0, 200),
          "\nContent length:",
          content.length
        );
        throw new Error("Invalid JSON format in API response");
      }
      throw error;
    }

    // Get the first available participant if sender is "me"
    if (messageData.sender === "me" && sortedParticipants.length > 0) {
      messageData.sender = sortedParticipants[0].name;
    }

    // Validate sender
    if (
      !sortedParticipants.find((r: Recipient) => r.name === messageData.sender)
    ) {
      console.error(
        "Available participants:",
        sortedParticipants.map((r: Recipient) => r.name)
      );
      console.error("Received sender:", messageData.sender);
      throw new Error(
        "Invalid sender: must be one of the available participants"
      );
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
