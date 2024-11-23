import { NextResponse, NextRequest } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET(req: NextRequest) {
  console.log(' [stream-chat] GET request received');
  
  const url = new URL(req.url);
  const promptParam = url.searchParams.get('prompt');
  
  if (!promptParam) {
    console.error(' [stream-chat] No prompt parameter found');
    return new Response('No prompt parameter found', { status: 400 });
  }

  console.log(' [stream-chat] Parsing prompt parameter');
  const { recipients, conversationHistory, topic, isInitialMessage } = JSON.parse(promptParam);
  
  console.log(' [stream-chat] Request params:', {
    recipients,
    topic,
    isInitialMessage,
    conversationHistoryLength: conversationHistory?.length
  });

  const prompt = `
    You are simulating a conversation between these people: ${recipients.join(', ')}.
    Generate a natural conversation between them.
    Format each message as "[Speaker]: [Message]" with each message on a new line.
    Make the conversation engaging and natural, reflecting each person's known personality and relationship.
    Keep messages concise and conversational.
    Continue the conversation naturally.
  `;

  console.log(' [stream-chat] Generated prompt:', prompt);

  let currentMessage = '';
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log(' [stream-chat] Starting OpenAI stream');
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: prompt }],
          stream: true,
          temperature: 0.9,
          max_tokens: 500,
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
                  const messageData = {
                    sender: speaker.trim().replace(/^"|"$/g, ''),  // Remove any surrounding quotes
                    content: content.trim()
                  };
                  console.log(' [stream-chat] Sending message data:', messageData);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageData)}\n\n`));
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
            const messageData = {
              sender: speaker.trim().replace(/^"|"$/g, ''),  // Remove any surrounding quotes
              content: content.trim()
            };
            console.log(' [stream-chat] Sending final message data:', messageData);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageData)}\n\n`));
          }
        }

        console.log(' [stream-chat] Stream completed');
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error(' [stream-chat] Error in stream:', error);
        controller.error(error);
      } finally {
        console.log(' [stream-chat] Stream completed');
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

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
    Generate a natural conversation between them.
    Format each message as "[Speaker]: [Message]" with each message on a new line.
    Make the conversation engaging and natural, reflecting each person's known personality and relationship.
    Keep messages concise and conversational.
    Continue the conversation naturally.
  `;

  console.log(' [stream-chat] Generated prompt:', prompt);

  let currentMessage = '';
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log(' [stream-chat] Starting OpenAI stream');
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: prompt }],
          stream: true,
          temperature: 0.9,
          max_tokens: 500,
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
                  const messageData = {
                    sender: speaker.trim().replace(/^"|"$/g, ''),  // Remove any surrounding quotes
                    content: content.trim()
                  };
                  console.log(' [stream-chat] Sending message data:', messageData);
                  controller.enqueue(`data: ${JSON.stringify(messageData)}\n\n`);
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
            const messageData = {
              sender: speaker.trim().replace(/^"|"$/g, ''),  // Remove any surrounding quotes
              content: content.trim()
            };
            console.log(' [stream-chat] Sending final message data:', messageData);
            controller.enqueue(`data: ${JSON.stringify(messageData)}\n\n`);
          }
        }

        console.log(' [stream-chat] Stream completed');
        controller.enqueue('data: [DONE]\n\n');
      } catch (error) {
        console.error(' [stream-chat] Error in stream:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
