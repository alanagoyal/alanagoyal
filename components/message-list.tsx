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
  messageInputRef?: React.RefObject<{ focus: () => void }>;
}

export function MessageList({ 
  messages, 
  conversation, 
  typingStatus, 
  conversationId,
  onReaction,
  messageInputRef
}: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isAnyReactionMenuOpen, setIsAnyReactionMenuOpen] = useState(false);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);

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

  // Update lastSentMessageId when a new message is added
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === "me") {
        setLastSentMessageId(lastMessage.id);
        // Clear the lastSentMessageId after animation duration
        const timer = setTimeout(() => {
          setLastSentMessageId(null);
        }, 1000); // Adjust this timing to match your animation duration
        return () => clearTimeout(timer);
      }
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
              isLastUserMessage={index === lastUserMessageIndex}
              conversation={conversation}
              isTyping={false}
              onReaction={onReaction}
              onOpenChange={(isOpen) => {
                // Track active reaction menu to dim other messages
                setActiveMessageId(isOpen ? message.id : null);
                setIsAnyReactionMenuOpen(isOpen);
              }}
              onReactionComplete={() => {
                // Focus input after reaction for smooth typing flow
                messageInputRef?.current?.focus();
              }}
              justSent={message.id === lastSentMessageId}
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
