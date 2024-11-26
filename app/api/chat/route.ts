import { OpenAI } from "openai";
import { Message } from "@/types";
import { Recipient } from "../../../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const body = await req.json();
  const { recipients, messages, shouldWrapUp } = body;

  // Determine who spoke last to ensure proper turn-taking
  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1] : null;
  const availableParticipants = recipients.filter(
    (r: Recipient) => r !== lastMessage?.sender
  );

  const wrapUpGuidelines = shouldWrapUp
    ? `
    8. This should be the last message in the conversation
    9. Naturally conclude the discussion in a way that doesn't require further response
    10. Be subtle about ending the conversation - don't allude to a wrap-up
    11. End on a positive or conclusive note that wraps up the current topic`
    : "";

  const prompt = `
    You are participating in a socratic-style conversation between these people: ${recipients
      .map((r: Recipient) => r.name)
      .join(", ")}.
    Based on the conversation history, generate the NEXT SINGLE message from one of these participants: ${availableParticipants
      .map((r: Recipient) => r.name)
      .join(", ")}.
    The message should be natural and contextually appropriate.

    IMPORTANT: Your response must be a valid JSON object with exactly this format:
    {
      "sender": "name_of_participant",
      "content": "their_message"
    }

    Guidelines:
    1. Generate only ONE message
    2. Choose an appropriate next speaker from the available participants list
    3. Stay in context with the previous messages
    4. Keep responses natural and engaging
    5. Do not use quotes or special formatting in the content
    6. Keep messages concise and conversational
    7. Make sure to advance the conversation naturally${wrapUpGuidelines}
  `;

  try {
    // Convert conversation history to OpenAI message format
    const openaiMessages = [
      { role: "system", content: prompt },
      ...(messages || []).map((msg: Message) => ({
        role: "user",
        content: `${msg.sender}: ${msg.content}`,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.9,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the response as JSON
    let messageData;
    try {
      messageData = JSON.parse(content);
    } catch (error) {
      console.error(" [chat] Error parsing JSON:", error);
      // If JSON parsing fails, try to extract sender and content from the format "Sender: Message"
      const match = content.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, sender, messageContent] = match;
        messageData = {
          sender: sender.trim(),
          content: messageContent.trim(),
        };
      } else {
        throw new Error("Invalid response format");
      }
    }

    // Validate that the sender is one of the available participants
    if (
      !availableParticipants.find(
        (r: Recipient) =>
          r.name.toLowerCase() === messageData.sender.toLowerCase()
      )
    ) {
      throw new Error(
        "Invalid sender: must be one of the available participants"
      );
    }

    return new Response(JSON.stringify(messageData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(" [chat] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
