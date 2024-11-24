import { OpenAI } from "openai";
import { Message } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Add delay function at the top level
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  console.log(' [stream-chat] POST request received');
  
  const body = await req.json();
  const { recipients, conversationHistory, topic, isInitialMessage } = body;
  
  console.log(' [stream-chat] Request params:', {
    recipients,
    topic,
    isInitialMessage,
    conversationHistoryLength: conversationHistory?.length
  });

  const prompt = `
    You are simulating a conversation between these people: ${recipients.join(', ')}.
    Generate a natural back-and-forth conversation between them with multiple messages.
    Format each message exactly as "[Speaker]: [Message]" with each message on a new line.
    Make the conversation engaging and natural, reflecting each person's known personality and relationship.
    Keep individual messages concise and conversational.
    Generate at least 2-3 messages to maintain a flowing conversation.
    Continue the conversation naturally based on the previous messages.
    Do not use quotes around messages.
    Do not add closing quotes or punctuation at the end of messages.
    Do not end the conversation abruptly - keep the dialogue going.
    
    Remember to:
    1. Generate multiple messages (at least 2-3)
    2. Keep the conversation flowing naturally
    3. Have participants respond to each other
    4. Stay in context with the previous messages
  `;

  console.log(' [stream-chat] Generated prompt:', prompt);

  let currentMessage = '';
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log(' [stream-chat] Starting OpenAI stream');

        // Convert conversation history to OpenAI message format
        const messages = [
          { role: "system", content: prompt },
          ...(conversationHistory || []).map((msg: Message) => ({
            role: "user",
            content: `${msg.sender}: ${msg.content}`
          }))
        ];

        console.log(' [stream-chat] Messages array:', messages);

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          stream: true,
          temperature: 0.9,
          max_tokens: 1000,
        });

        console.log(' [stream-chat] OpenAI stream connected');

        for await (const part of response) {
          const token = part.choices[0]?.delta?.content || "";
          if (token) {
            console.log(' [stream-chat] Token received:', token);
            currentMessage += token;
            
            // Check if we have a complete message
            if (currentMessage.includes('\n') || token.includes('\n')) {
              const messages = currentMessage.split('\n').filter(Boolean);
              for (const msg of messages) {
                const match = msg.match(/^([^:]+):\s*(.+)$/);
                if (match) {
                  const [, speaker, content] = match;
                  const messageData: Partial<Message> = {
                    sender: speaker.trim().replace(/^"|"$/g, ''),
                    content: content.trim()
                  };
                  console.log(' [stream-chat] Sending message data:', messageData);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageData)}\n\n`));
                  
                  // Add 2-second delay between messages to allow for user interjection
                  await delay(2000);
                }
              }
              // Keep any incomplete message
              currentMessage = messages[messages.length - 1]?.includes(':') ? '' : messages[messages.length - 1] || '';
            }
          }
        }

        // Send any remaining message
        if (currentMessage.trim()) {
          const match = currentMessage.trim().match(/^([^:]+):\s*(.+)$/);
          if (match) {
            const [, speaker, content] = match;
            const messageData: Partial<Message> = {
              sender: speaker.trim().replace(/^"|"$/g, ''),
              content: content.trim()
            };
            console.log(' [stream-chat] Sending final message data:', messageData);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageData)}\n\n`));
          }
        }

        console.log(' [stream-chat] Stream completed');
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error: any) {
        console.error(' [stream-chat] Error in stream:', error);
        
        // Check if the request was aborted
        if (error.name === 'AbortError') {
          console.log(' [stream-chat] Request aborted by client');
          controller.close();
          return;
        }

        // Handle other errors
        const errorMessage = {
          sender: "system",
          content: "An error occurred while processing your message. Please try again.",
        };
        const encodedError = encoder.encode(JSON.stringify(errorMessage));
        controller.enqueue(encodedError);
        controller.close();
      }
    },
    cancel() {
      console.log(' [stream-chat] Stream cancelled');
      // Clean up any resources if needed
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
