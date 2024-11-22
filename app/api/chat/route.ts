import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { wrapAISDKModel } from "braintrust";
import { logger } from "../logger";

export async function POST(req: Request) {
  const { messages, participants } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;

  const openai = createOpenAI({
    apiKey,
    baseURL: "https://api.braintrust.dev/v1/proxy",
  });

  const customOpenAI = wrapAISDKModel(openai("gpt-4o-mini"));

  const systemPrompt = `You are simulating a continuous group chat conversation between ${participants.join(
    ", "
  )}. 
    Each response should be from one of these participants, formatted as JSON with "speaker" and "message" fields.
    Stay in character for each participant based on their known personality and expertise.
    If a user asks a question, have one of the participants respond appropriately while maintaining character.
    Keep responses conversational and natural, as if in an iMessage chat.
    After each message, automatically continue the conversation with a response from the other participant.`;

  return await logger.traced(
    async (span: any) => {
      const apiMessages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ];

      try {
        const response = await streamText({
          model: customOpenAI,
          messages: apiMessages,
          temperature: 0.7,
        });

        const headers = new Headers();
        headers.set("x-braintrust-span-id", span.id);

        return response.toDataStreamResponse({ headers });
      } catch (e) {
        span.setError(e);
        return new Response("Error processing your request", { status: 500 });
      }
    },
    {
      name: "Chat",
      event: {
        input: {
          messages,
        },
      },
    }
  );
}
