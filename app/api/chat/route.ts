import { OpenAI } from "openai";
import { Recipient, Message } from "../../../types";
import { logger } from "../logger";

const openai = new OpenAI({ 
  baseURL: "https://api.braintrust.dev/v1/proxy",
  apiKey: process.env.OPENAI_API_KEY! 
});

export async function POST(req: Request) {
  const body = await req.json();
  const { recipients, messages, shouldWrapUp, isFirstMessage } = body;

  // Determine who spoke last to ensure proper turn-taking
  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1] : null;
  const availableParticipants = recipients.filter(
    (r: Recipient) => r !== lastMessage?.sender
  );

  const wrapUpGuidelines = shouldWrapUp
    ? `
    10. This should be the last message in the conversation
    11. Naturally conclude the discussion in a way that doesn't require further response
    12. Be subtle about ending the conversation without explicitly alluding to a wrap-up`
    : "";

  const firstMessageGuidelines = isFirstMessage
    ? `
    10. As this is the first message, warmly initiate the conversation
    11. Set a friendly and engaging tone
    12. Pose a question or make a statement that encourages response from others`
    : "";

  const prompt = `
    You are participating in a socratic-style group chat conversation between these people: ${recipients
      .map((r: Recipient) => r.name)
      .join(", ")}.
    Based on the conversation history, generate the NEXT SINGLE message from one of these participants: ${availableParticipants
      .map((r: Recipient) => r.name)
      .join(", ")}.
    The message should be natural and contextually appropriate and in the tone of the person speaking it.

    IMPORTANT: Your response must be a valid JSON object with exactly this format:
    {
      "sender": "name_of_participant",
      "content": "their_message"
    }

    Guidelines:
    1. Generate only ONE message
    3. Choose an appropriate next speaker from the available participants list
    4. Stay in context with the previous messages
    5. Speak in the style and tone of the participant you are speaking as
    6. Keep responses natural and engaging
    7. Do not use quotes or special formatting in the content
    8. Keep messages concise and conversational like a group chat
    9. Make sure to advance the conversation naturally${wrapUpGuidelines}${firstMessageGuidelines}
  `;

  return await logger.traced(
    async () => {
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
          headers: { 
            "Content-Type": "application/json"
          },
        });
      } catch (error) {
        console.error(" [chat] Error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to generate message" }),
          {
            status: 500,
            headers: { 
              "Content-Type": "application/json"
            },
          }
        );
      }
    },
    {
      name: "dialogue",
      event: {
        input: {
          recipients,
          messages,
          shouldWrapUp,
          isFirstMessage
        },
      },
    }
  );
}
