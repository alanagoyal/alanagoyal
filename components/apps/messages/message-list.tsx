import { Message, Conversation, Reaction } from "@/types/messages";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/lib/messages/sound-effects";

/**
 * Determines if incoming message sounds should be muted.
 * Sounds are muted if:
 * - The conversation has "Hide Alerts" enabled (per-conversation mute)
 * - Focus mode is active (system-wide mute)
 */
function shouldMuteIncomingSound(hideAlerts: boolean | undefined, focusModeActive: boolean): boolean {
  return Boolean(hideAlerts) || focusModeActive;
}

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

  const isAtBottom = () => {
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return true;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    return Math.abs(scrollHeight - clientHeight - scrollTop) < 336;
  };

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
  }, []);

  // Auto-scroll only if we were at bottom
  useEffect(() => {
    if (!wasAtBottom && !isAtBottom()) return;

    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return;

    const scrollToBottom = viewport.scrollHeight - viewport.clientHeight;
    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: scrollToBottom,
        behavior: "smooth",
      });
    });

    // Update previous state after scroll
    setPrevMessageCount(messages.length);
    setPrevConversationId(conversationId);
  }, [messages, wasAtBottom, conversationId, isAtBottom]);

  // Handle new message effects (sounds, animations)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessageInSameConversation =
        conversationId === prevConversationId &&
        messages.length > prevMessageCount;

      // Play sound for incoming messages in the active conversation (unless muted)
      if (isNewMessageInSameConversation) {
        const isIncomingMessage = lastMessage.sender !== "me" && lastMessage.sender !== "system";
        if (isIncomingMessage && !shouldMuteIncomingSound(conversation?.hideAlerts, focusModeActive)) {
          soundEffects.playReceivedSound();
        }
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
  }, [messages, conversationId, prevConversationId, prevMessageCount]);

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
