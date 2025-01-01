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
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isAnyReactionMenuOpen, setIsAnyReactionMenuOpen] = useState(false);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const isTypingInThisConversation = typingStatus && 
    typingStatus.conversationId === conversationId;

  useEffect(() => {
    // If someone is typing, scroll to typing indicator
    if (isTypingInThisConversation && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Otherwise if there are messages, scroll to last message
    else if (messages.length > 0 && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTypingInThisConversation]);

  useEffect(() => {
    const messageListElement = messageListRef.current;
    if (messageListElement) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          console.log('Message list height:', entry.contentRect.height);
        }
      });

      observer.observe(messageListElement);
      return () => observer.disconnect();
    }
  }, []);

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
      ref={messageListRef}
      className="flex-1 p-4 pb-0 flex flex-col-reverse relative"
    >
    <div className="space-y-2 flex-1">
      {messages.map((message, index, array) => (
        <div 
          key={message.id} 
          ref={index === array.length - 1 ? lastMessageRef : null}
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
        <div ref={typingRef}>
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
        </div>
      )}
      </div>
    </div>
  );
}
