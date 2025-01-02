import { Conversation, Reaction } from "../types";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  isNewChat: boolean;
  activeConversation?: Conversation;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  onSendMessage: (message: string, conversationId?: string) => void;
  onReaction?: (messageId: string, reaction: Reaction) => void;
  typingStatus: { conversationId: string; recipient: string; } | null;
  conversationId: string | null;
  onUpdateConversationRecipients?: (conversationId: string, recipients: string[]) => void;
  onCreateConversation?: (recipientNames: string[]) => void;
  messageDraft?: string;
  onMessageDraftChange?: (conversationId: string, message: string) => void;
  unreadCount?: number;
}

export function ChatArea({
  isNewChat,
  activeConversation,
  recipientInput,
  setRecipientInput,
  isMobileView,
  onBack,
  onSendMessage,
  onReaction,
  typingStatus,
  conversationId,
  onUpdateConversationRecipients,
  onCreateConversation,
  messageDraft = "",
  onMessageDraftChange,
  unreadCount = 0,
}: ChatAreaProps) {
  const [showCompactNewChat, setShowCompactNewChat] = useState(false);

  useEffect(() => {
    if (isNewChat) {
      setShowCompactNewChat(false);
    }
  }, [isNewChat]);

  const showRecipientInput = isNewChat && !activeConversation;
  const messageInputRef = useRef<{ focus: () => void }>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Get the current scroll viewport
          const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            // Scroll to bottom with smooth animation
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      });
    });

    // Watch for style changes on document root (where we store the CSS variable)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if ("virtualKeyboard" in navigator) {
      // @ts-expect-error VirtualKeyboard API is not yet in TypeScript types
      navigator.virtualKeyboard.overlaysContent = true;
    }
  }, []);

  const conversationRecipients = activeConversation?.recipients || [];

  // Create a key that changes when recipients change
  const messageInputKey = conversationRecipients.map(r => r.id).join(',');

  const handleMessageChange = (msg: string) => {
    if (isNewChat) {
      onMessageDraftChange?.("new", msg);
    } else if (conversationId) {
      onMessageDraftChange?.(conversationId, msg);
    }
  };

  const handleSend = () => {
    if (!messageDraft.trim()) return;
    
    if (activeConversation) {
      onSendMessage(messageDraft, activeConversation.id);
    } else if (isNewChat && recipientInput.trim()) {
      const recipientList = recipientInput
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      if (recipientList.length > 0) {
        onSendMessage(messageDraft);
      }
    }
  };

  return (
    <div className="h-dvh relative">
      <div className="absolute top-0 left-0 right-0 z-50">
        <ChatHeader
          isNewChat={showRecipientInput}
          activeConversation={activeConversation}
          recipientInput={recipientInput}
          setRecipientInput={setRecipientInput}
          isMobileView={isMobileView}
          onBack={onBack}
          showCompactNewChat={showCompactNewChat}
          setShowCompactNewChat={setShowCompactNewChat}
          onUpdateRecipients={(recipients) => {
            if (conversationId) {
              onUpdateConversationRecipients?.(conversationId, recipients);
            }
          }}
          onCreateConversation={onCreateConversation}
          unreadCount={unreadCount}
        />
      </div>
      
      <ScrollArea 
        ref={scrollAreaRef}
        className="h-full"
        isMobile={isMobileView}
        withVerticalMargins
        mobileHeaderHeight={isMobileView}
        bottomMargin="calc(var(--dynamic-height, 64px))"
      >
        <div 
          className={cn(isMobileView ? "pt-24" : "pt-16")}
          style={{ 
            paddingBottom: 'calc(var(--dynamic-height, 64px)'
          }}
        >
          <div className="flex-1 relative">
            {/* Gradient background */}
            <div 
              className="absolute inset-0" 
              style={{ background: "linear-gradient(#43cdf6,#0087fe)" }} 
            />
            
            {/* Message list with white background */}
            <div className="relative h-full bg-background">
              <MessageList
                messages={activeConversation?.messages || []}
                conversation={activeConversation}
                typingStatus={typingStatus?.conversationId === conversationId ? typingStatus : null}
                onReaction={onReaction}
                conversationId={conversationId}
                messageInputRef={messageInputRef}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 z-50" style={{
        marginBottom: 'env(keyboard-inset-height, 0px)'
      }}>
        <MessageInput
          key={messageInputKey}
          ref={messageInputRef}
          message={messageDraft}
          setMessage={handleMessageChange}
          handleSend={handleSend}
          disabled={isNewChat && !recipientInput}
          recipients={conversationRecipients}
          isMobileView={isMobileView}
          conversationId={conversationId || undefined}
          isNewChat={isNewChat}
        />
      </div>
    </div>
  );
}
