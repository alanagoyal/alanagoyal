import { Conversation } from "../types";
import { useEffect } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatAreaProps {
  isNewChat: boolean;
  activeConversation?: Conversation;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  onSendMessage: (message: string, conversationId?: string) => void;
  typingStatus: { conversationId: string; recipient: string; } | null;
  conversationId: string | null;
  onUpdateConversationRecipients?: (conversationId: string, recipients: string[]) => void;
  onCreateConversation?: (recipientNames: string[]) => void;
  messageDraft?: string;
  onMessageDraftChange?: (conversationId: string, message: string) => void;
}

export function ChatArea({
  isNewChat,
  activeConversation,
  recipientInput,
  setRecipientInput,
  isMobileView,
  onBack,
  onSendMessage,
  typingStatus,
  conversationId,
  onUpdateConversationRecipients,
  onCreateConversation,
  messageDraft = "",
  onMessageDraftChange,
}: ChatAreaProps) {
  const showRecipientInput = isNewChat && !activeConversation;

  useEffect(() => {
    if ("virtualKeyboard" in navigator) {
      // @ts-expect-error VirtualKeyboard API is not yet in TypeScript types
      navigator.virtualKeyboard.overlaysContent = true;
    }
  }, []);

  const conversationRecipients = activeConversation?.recipients || [];

  return (
    <div className="h-dvh flex flex-col">
      <div className="sticky top-0 z-20 bg-background">
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
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <MessageList
          messages={activeConversation?.messages || []}
          conversation={activeConversation}
          typingStatus={typingStatus}
          conversationId={conversationId}
        />
      </div>
      <div className="sticky bottom-0 bg-background z-20" style={{
        marginBottom: 'env(keyboard-inset-height, 0px)'
      }}>
        <MessageInput
          message={messageDraft}
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
