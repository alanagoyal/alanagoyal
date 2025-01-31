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
  typingStatus: { conversationId: string; recipient: string } | null;
  conversationId: string | null;
  onUpdateConversationRecipients?: (
    conversationId: string,
    recipients: string[]
  ) => void;
  onCreateConversation?: (recipientNames: string[]) => void;
  onUpdateConversationName?: (name: string) => void;
  onHideAlertsChange?: (hide: boolean) => void;
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
  onUpdateConversationName,
  onHideAlertsChange,
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
  const messageInputKey = conversationRecipients.map((r) => r.id).join(",");

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
          recipientInput={recipientInput}
          setRecipientInput={setRecipientInput}
          onBack={onBack}
          isMobileView={isMobileView}
          activeConversation={activeConversation}
          onUpdateRecipients={
            onUpdateConversationRecipients
              ? (recipients) =>
                  onUpdateConversationRecipients(conversationId!, recipients)
              : undefined
          }
          onCreateConversation={onCreateConversation}
          onUpdateConversationName={onUpdateConversationName}
          onHideAlertsChange={onHideAlertsChange}
          unreadCount={unreadCount}
          showCompactNewChat={showCompactNewChat}
          setShowCompactNewChat={setShowCompactNewChat}
        />
      </div>
      <ScrollArea
        className="h-full flex flex-col"
        isMobile={isMobileView}
        withVerticalMargins
        mobileHeaderHeight={isMobileView}
        bottomMargin="calc(var(--dynamic-height, 64px))"
      >
        <div
          className={cn(
            "absolute bg-gradient-to-b w-full from-[#43CDF6] to-[#0A7CFF]",
            isMobileView
              ? "top-24 h-[calc(100vh-96px-var(--dynamic-height,64px))]"
              : "top-16 h-[calc(100vh-64px-var(--dynamic-height,64px))]"
          )}
        />
        <div
          className={cn(
            "min-h-screen flex flex-col",
            isMobileView ? "pt-24" : "pt-16",
            "pb-[var(--dynamic-height,64px)]"
          )}
        >
          <div className="flex-1 flex flex-col relative">
            <div className="relative h-full flex">
              <div className="w-3 bg-background" />
              <MessageList
                messages={activeConversation?.messages || []}
                conversation={activeConversation}
                typingStatus={
                  typingStatus?.conversationId === conversationId
                    ? typingStatus
                    : null
                }
                onReaction={(messageId, reaction) => {
                  onReaction?.(messageId, reaction);
                }}
                conversationId={conversationId}
                messageInputRef={messageInputRef}
              />
              <div className="w-3 bg-background" />
            </div>
            <div className="bg-background flex-1" />
          </div>
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 z-50 mb-[env(keyboard-inset-height,0px)]">
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
