import { Message, Conversation, Reaction } from "@/types/messages";
import { MessageBubble } from "./message-bubble";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { soundEffects, shouldMuteIncomingSound } from "@/lib/messages/sound-effects";

interface MessageListProps {
  messages: Message[];
  conversation?: Conversation;
  typingStatus: { conversationId: string; recipient: string } | null;
  conversationId: string | null;
  onReaction?: (messageId: string, reaction: Reaction) => void;
  onReactionComplete?: () => void;
  messageInputRef?: React.RefObject<{ focus: () => void }>;
  isMobileView?: boolean;
  focusModeActive?: boolean;
}

export function MessageList({
  messages,
  conversation,
  typingStatus,
  conversationId,
  onReaction,
  onReactionComplete,
  messageInputRef,
  isMobileView,
  focusModeActive = false,
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
  const messageListRef = useRef<HTMLDivElement>(null);
  const [wasAtBottom, setWasAtBottom] = useState(true);

  const lastUserMessageIndex = messages.findLastIndex(
    (msg) => msg.sender === "me"
  );

  const isTypingInThisConversation =
    typingStatus && typingStatus.conversationId === conversationId;

  const isAtBottom = useCallback(() => {
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return true;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    return Math.abs(scrollHeight - clientHeight - scrollTop) < 336;
  }, []);

  // Track scroll position
  useEffect(() => {
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return;

    const handleScroll = () => {
      setWasAtBottom(isAtBottom());
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [isAtBottom]);

  // Ref to track if we should auto-scroll (persists across ResizeObserver callbacks)
  const shouldAutoScrollRef = useRef(true);

  // Update shouldAutoScrollRef when wasAtBottom changes
  useEffect(() => {
    shouldAutoScrollRef.current = wasAtBottom || isAtBottom();
  }, [wasAtBottom, isAtBottom]);

  // Use ResizeObserver to scroll when content size changes (handles reactions, new messages, etc.)
  useEffect(() => {
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return;

    const scrollToBottom = () => {
      const scrollTarget = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTo({
        top: scrollTarget,
        behavior: "smooth",
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      if (shouldAutoScrollRef.current) {
        scrollToBottom();
      }
    });

    // Observe the scrollable content container
    const content = viewport.firstElementChild;
    if (content) {
      resizeObserver.observe(content);
    }

    return () => resizeObserver.disconnect();
  }, [conversationId]);

  // Update previous state tracking for sound effects
  useEffect(() => {
    setPrevMessageCount(messages.length);
    setPrevConversationId(conversationId);
  }, [messages, conversationId]);

  // Handle new message effects (sounds, animations)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessageInSameConversation =
        conversationId === prevConversationId &&
        messages.length > prevMessageCount;

      // Only process effects for new messages in the same conversation
      if (isNewMessageInSameConversation) {
        // Play sound for incoming messages in the active conversation (unless muted)
        const isIncomingMessage = lastMessage.sender !== "me" && lastMessage.sender !== "system";
        if (isIncomingMessage && !shouldMuteIncomingSound(conversation?.hideAlerts, focusModeActive)) {
          soundEffects.playReceivedSound();
        }

        // Trigger "delivered" animation for sent messages
        if (lastMessage.sender === "me") {
          setLastSentMessageId(lastMessage.id);
          // Clear the lastSentMessageId after animation duration
          const timer = setTimeout(() => {
            setLastSentMessageId(null);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [messages, conversationId, prevConversationId, prevMessageCount, conversation?.hideAlerts, focusModeActive]);

  return (
    <div ref={messageListRef} className="flex-1 flex flex-col-reverse relative">
      {/* Messages layer */}
      <div className="flex-1 relative">
        {messages.map((message, index) => (
          <div
            key={message.id}
            data-message-id={message.id}
            className="relative"
          >
            {/* Overlay for non-active messages */}
            {isAnyReactionMenuOpen && message.id !== activeMessageId && (
              <div className="absolute inset-0 bg-white/90 dark:bg-[#1A1A1A]/90 pointer-events-none z-20" />
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
                isMobileView={isMobileView}
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
              isMobileView={isMobileView}
            />
          </div>
        )}
      </div>
      <div className="h-2 bg-background" />
    </div>
  );
}
