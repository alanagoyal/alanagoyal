import { Message, Conversation, Reaction } from "../types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/lib/sound-effects";

interface MessageListProps {
  messages: Message[];
  conversation?: Conversation;
  typingStatus: { conversationId: string; recipient: string } | null;
  conversationId: string | null;
  onReaction?: (messageId: string, reaction: Reaction) => void;
  onReactionComplete?: () => void;
  messageInputRef?: React.RefObject<{ focus: () => void }>;
}

export function MessageList({
  messages,
  conversation,
  typingStatus,
  conversationId,
  onReaction,
  onReactionComplete,
  messageInputRef,
}: MessageListProps) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isAnyReactionMenuOpen, setIsAnyReactionMenuOpen] = useState(false);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(
    null
  );
  const [prevConversationId, setPrevConversationId] = useState<string | null>(
    null
  );
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [prevMessages, setPrevMessages] = useState<Message[]>([]);

  const lastUserMessageIndex = messages.findLastIndex(
    (msg) => msg.sender === "me"
  );
  const messageListRef = useRef<HTMLDivElement>(null);

  const isTypingInThisConversation =
    typingStatus && typingStatus.conversationId === conversationId;

  const isMessageNearBottom = (messageId: string) => {
    // Try to find the actual scrollable viewport
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (!viewport) {
      return false;
    }

    const messageElement = messageListRef.current?.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (!messageElement) {
      return false;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();

    // Consider "near bottom" if the message is in the bottom 2/3 of the viewport
    const nearBottomThreshold = viewportRect.height * 0.33; // top 1/3
    const isNear = messageRect.top >= viewportRect.top + nearBottomThreshold;
    return isNear;
  };

  const shouldAutoScroll = () => {
    // Always scroll when typing starts
    if (isTypingInThisConversation) {
      return true;
    }

    // If no previous messages, this is initial load
    if (prevMessages.length === 0) {
      return true;
    }

    // Check if this is a new message
    if (messages.length > prevMessages.length) {
      return true;
    }

    // If reaction menu is open, only scroll if the message is near the bottom
    if (isAnyReactionMenuOpen && activeMessageId) {
      const shouldScroll = isMessageNearBottom(activeMessageId);
      return shouldScroll;
    }

    return false;
  };

  useEffect(() => {
    const should = shouldAutoScroll();

    if (should) {
      // Find the ScrollArea viewport
      const viewport = messageListRef.current?.closest(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (viewport) {
        const scrollToBottom = viewport.scrollHeight - viewport.clientHeight;

        // Force layout recalculation and scroll
        requestAnimationFrame(() => {
          viewport.scrollTop = scrollToBottom;

          // Then do smooth scroll
          viewport.scrollTo({
            top: scrollToBottom,
            behavior: "smooth",
          });
        });
      }
    }

    // Update previous messages after scroll check
    setPrevMessages(messages);
    setPrevConversationId(conversationId);
    setPrevMessageCount(messages.length);
  }, [messages, isTypingInThisConversation]);

  // Update lastSentMessageId when a new message is added
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only play sound if this is a new message in the same conversation
      if (
        conversationId === prevConversationId &&
        messages.length > prevMessageCount
      ) {
        if (lastMessage.sender !== "me" && lastMessage.sender !== "system") {
          soundEffects.playReceivedSound();
        }
        if (lastMessage.sender === "me") {
          setLastSentMessageId(lastMessage.id);
          // Clear the lastSentMessageId after animation duration
          const timer = setTimeout(() => {
            setLastSentMessageId(null);
          }, 1000); // Adjust this timing to match your animation duration
          return () => clearTimeout(timer);
        }
      }
    }
  }, [messages, conversationId, prevConversationId, prevMessageCount]);

  return (
    <div ref={messageListRef} className="flex-1 flex flex-col-reverse relative">
      {/* Messages layer */}
      <div className="flex-1 relative">
        {messages.map((message, index, array) => (
          <div
            key={message.id}
            data-message-id={message.id}
            className="relative"
          >
            {/* Overlay for non-active messages */}
            {isAnyReactionMenuOpen && message.id !== activeMessageId && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#1E1E1E]/80 pointer-events-none z-20" />
            )}
            <div className={cn(message.id === activeMessageId && "z-30")}>
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
                  messageInputRef?.current?.focus();
                  onReactionComplete?.();
                }}
                justSent={message.id === lastSentMessageId}
              />
            </div>
          </div>
        ))}
        {isTypingInThisConversation && (
          <div>
            <MessageBubble
              message={{
                id: "typing",
                content: "",
                sender: typingStatus.recipient,
                timestamp: new Date().toLocaleTimeString(),
              }}
              isTyping={true}
              conversation={conversation}
            />
          </div>
        )}
      </div>
      <div className="h-2 bg-background" />
    </div>
  );
}
