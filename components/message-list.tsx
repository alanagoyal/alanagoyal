import { Message, Conversation, Reaction } from "../types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  conversation?: Conversation;
  typingStatus: { conversationId: string; recipient: string; } | null;
  conversationId: string | null;
  onReaction?: (messageId: string, reaction: Reaction) => void;
}

export function MessageList({ 
  messages, 
  conversation, 
  typingStatus, 
  conversationId,
  onReaction
}: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isAnyReactionMenuOpen, setIsAnyReactionMenuOpen] = useState(false);

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
      className="flex-1 p-4 pb-0 overflow-y-auto flex flex-col-reverse relative"
    >
      <div className="space-y-4 flex-1">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={cn(
              "transition-opacity",
              isAnyReactionMenuOpen && message.id !== activeMessageId && "opacity-40"
            )}
          >
            <MessageBubble 
              message={message} 
              conversation={conversation}
              isLastUserMessage={index === lastUserMessageIndex}
              onReaction={onReaction}
              onOpenChange={(isOpen) => {
                setIsAnyReactionMenuOpen(isOpen);
                setActiveMessageId(isOpen ? message.id : null);
              }}
            />
          </div>
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
