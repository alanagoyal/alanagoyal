import { ScrollArea } from "./ui/scroll-area";
import { Message, Conversation } from "../types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  conversation?: Conversation;
  typingRecipient?: string | null;
}

export function MessageList({ messages, conversation, typingRecipient }: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]); // Scroll when messages change

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            conversation={conversation}
            isLastUserMessage={index === lastUserMessageIndex}
            typingRecipient={typingRecipient}
            isLastMessage={index === messages.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
