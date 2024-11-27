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

  const lastMessage = messages?.length > 0 ? messages[messages.length - 1] : null;
  const availableParticipants = recipients.filter(
    (r: Recipient) => r.name !== lastMessage?.sender
  );

  const prompt = `
    You are participating in a group chat conversation between ${recipients.map((r: Recipient) => r.name).join(", ")}.
    Based on the conversation history, generate the NEXT SINGLE message from one of these participants: ${availableParticipants.map((r: Recipient) => r.name).join(", ")}.
    The message should be natural, contextually appropriate, and reflect the style and tone of the person speaking.
    
    IMPORTANT: 
    1. Your response must be a valid JSON object with exactly this format:
    {
      "sender": "name_of_participant",
      "content": "their_message"
    }
    2. The "sender" MUST be one of these names: ${availableParticipants.map((r: Recipient) => r.name).join(", ")}
    3. Do NOT use "me" as a sender name
    
    Guidelines:
    1. Generate only ONE message.
    2. Choose an appropriate next speaker from the available participants list.
    3. Stay in context with the previous messages.
    4. Speak in the style and tone of the participant you are speaking as.
    5. Keep responses natural and engaging.
    6. Do not overuse the names of other participants; use names only when it feels natural.
    7. Encourage interaction by directing questions or comments to the group or individuals without making it seem forced.
    8. Keep messages concise and conversational like a real group chat.
    9. Make sure to advance the conversation naturally.
    10. Include elements of spontaneity or humor when appropriate to make the conversation more realistic.
    11. Do not repeat yourself or use the same phrase twice in a row.
    12. Avoid using quotes or special formatting in the content.
    ${shouldWrapUp ? `
    13. This should be the last message in the conversation
    14. Naturally conclude the discussion in a way that doesn't require further response
    15. Be subtle about ending the conversation without explicitly alluding to a wrap-up` : ""}
    ${isFirstMessage ? `
    13. As this is the first message, warmly initiate the conversation with a friendly and engaging tone
    14. Pose a question or make a statement that encourages response from the group` : ""}`;

  return await logger.traced(
    async () => {
      try {
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

        let messageData;
        try {
          messageData = JSON.parse(content);
        } catch (error) {
          console.error("Error parsing JSON:", error);
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

        // Validate sender
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
        console.error("Error:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to generate message",
            details: error instanceof Error ? error.message : String(error)
          }),
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
