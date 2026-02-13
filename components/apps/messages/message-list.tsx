import { Message, Conversation, Reaction } from "@/types/messages";
import { MessageBubble } from "./message-bubble";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { soundEffects, shouldMuteIncomingSound } from "@/lib/messages/sound-effects";
import { loadMessagesConversation } from "@/lib/sidebar-persistence";

// Tracks whether the component has been mounted in this page session.
// Resets on page refresh (module reloads). Persists across minimize/restore (page stays loaded).
// Also reset when sessionStorage has no persisted conversation (app was closed, not minimized).
let hasBeenMounted = false;

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
  const conversationReadyRef = useRef(false);
  const prevMessageCountRef = useRef(0);
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

  // Track scroll position (throttled via rAF to avoid 60fps state updates)
  useEffect(() => {
    const viewport = messageListRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!viewport) return;

    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setWasAtBottom(isAtBottom());
      });
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
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

    let isFirstScroll = true;

    // If sessionStorage has no persisted conversation, the app was closed (not minimized) — reset
    if (!loadMessagesConversation()) {
      hasBeenMounted = false;
    }

    const scrollToBottom = () => {
      // First scroll after mount: instant for conversation switch / restore, smooth for fresh app open
      // Subsequent scrolls (new messages, reactions): always smooth
      let behavior: ScrollBehavior = "smooth";
      if (isFirstScroll && hasBeenMounted) {
        behavior = "instant";
      }
      if (isFirstScroll) {
        isFirstScroll = false;
        hasBeenMounted = true;
      }
      const scrollTarget = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTo({
        top: scrollTarget,
        behavior,
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      if (isFirstScroll || shouldAutoScrollRef.current) {
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

  // Reset tracking when conversation changes (must be defined before the message effect)
  useEffect(() => {
    conversationReadyRef.current = false;
    prevMessageCountRef.current = 0;
  }, [conversationId]);

  // Handle new message effects (sounds, animations)
  useEffect(() => {
    // Skip the first render cycle per conversation (mount, switch, restore)
    if (!conversationReadyRef.current) {
      conversationReadyRef.current = true;
      prevMessageCountRef.current = messages.length;
      return;
    }

    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (!isNewMessage || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Play sound for incoming messages (unless muted)
    const isIncomingMessage = lastMessage.sender !== "me" && lastMessage.sender !== "system";
    if (isIncomingMessage && !shouldMuteIncomingSound(conversation?.hideAlerts, focusModeActive)) {
      soundEffects.playReceivedSound();
    }

    // Trigger "delivered" animation for sent messages
    if (lastMessage.sender === "me") {
      setLastSentMessageId(lastMessage.id);
      const timer = setTimeout(() => {
        setLastSentMessageId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, conversation?.hideAlerts, focusModeActive]);

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
                hideSenderName={index > 0 && messages[index - 1]?.sender === message.sender}
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
