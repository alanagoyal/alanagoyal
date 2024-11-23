import { ScrollArea } from "./ui/scroll-area";
import { Message, Conversation } from "../types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  conversation?: Conversation;
}

export function MessageList({ messages, isStreaming, conversation }: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const lastMessageIndex = messages.length - 1;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming]); // Scroll when messages change or streaming status changes

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            conversation={conversation}
            isLastUserMessage={index === lastUserMessageIndex}
            isStreaming={isStreaming && index === lastMessageIndex && message.sender !== "me"}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
