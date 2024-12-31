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

  useEffect(() => {
    if ("virtualKeyboard" in navigator) {
      // @ts-expect-error VirtualKeyboard API is not yet in TypeScript types
      navigator.virtualKeyboard.overlaysContent = true;
    }
  }, []);

  const conversationRecipients = activeConversation?.recipients || [];

  // Create a key that changes when recipients change
  const messageInputKey = conversationRecipients.map(r => r.id).join(',');

  return (
    <div className="h-dvh relative flex flex-col">
      <div className="absolute inset-0">
        <ScrollArea className="h-full" withVerticalMargins mobileHeaderHeight={isMobileView}>
          <div className={cn("pb-16", isMobileView ? "pt-24" : "pt-16")}>
            <MessageList
              messages={activeConversation?.messages || []}
              conversation={activeConversation}
              typingStatus={typingStatus?.conversationId === conversationId ? typingStatus : null}
              onReaction={onReaction}
              conversationId={conversationId}
              messageInputRef={messageInputRef}
            />
          </div>
        </ScrollArea>
      </div>
      <div className="absolute top-0 left-0 right-0 z-[100]">
        <ChatHeader
          isNewChat={showRecipientInput}
          recipientInput={recipientInput}
          setRecipientInput={setRecipientInput}
          onBack={onBack}
          isMobileView={isMobileView}
          activeConversation={activeConversation}
          onUpdateRecipients={(recipients) => {
            if (conversationId) {
              onUpdateConversationRecipients?.(conversationId, recipients);
            }
          }}
          onCreateConversation={onCreateConversation}
          showCompactNewChat={showCompactNewChat}
          setShowCompactNewChat={setShowCompactNewChat}
          unreadCount={unreadCount}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-[100]" style={{
        marginBottom: 'env(keyboard-inset-height, 0px)'
      }}>
        <MessageInput
          key={messageInputKey}
          ref={messageInputRef}
          message={messageDraft}
          isNewChat={isNewChat}
          setMessage={(msg) => {
            if (isNewChat) {
              onMessageDraftChange?.("new", msg);
            } else if (conversationId) {
              onMessageDraftChange?.(conversationId, msg);
            }
          }}
          handleSend={() => {
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
          }}
          recipients={conversationRecipients}
          isMobileView={isMobileView}
          conversationId={conversationId || undefined}
        />
      </div>
    </div>
  );
}
