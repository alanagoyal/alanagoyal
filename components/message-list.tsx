import { Message, Conversation } from "../types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  conversation?: Conversation;
  typingStatus: { conversationId: string; recipient: string; } | null;
  conversationId: string | null;
}

export function MessageList({ 
  messages, 
  conversation, 
  typingStatus, 
  conversationId 
}: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isTypingInThisConversation = typingStatus && 
    typingStatus.conversationId === conversationId;

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [messages]);

  return (
    <div 
      ref={scrollAreaRef} 
      className="flex-1 p-4 pb-0 overflow-y-auto flex flex-col-reverse"
    >
      <div className="space-y-4 flex-1">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            conversation={conversation}
            isLastUserMessage={index === lastUserMessageIndex}
          />
        ))}
        {isTypingInThisConversation && (
          <MessageBubble 
            message={{
              id: 'typing',
              content: '',
              sender: typingStatus.recipient,
              timestamp: new Date().toLocaleTimeString()
            }}
            isTyping={true}
            conversation={conversation}
          />
        )}
      </div>
    </div>
  );
}
