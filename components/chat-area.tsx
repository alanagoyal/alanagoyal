import { Conversation } from "../types";
import { useState, useEffect, useRef } from "react";
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
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);
  const showRecipientInput = isNewChat && !activeConversation;

  useEffect(() => {
    // Focus input when conversation becomes active
    if (activeConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [activeConversation]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    if (activeConversation) {
      onSendMessage(message, activeConversation.id);
    } else if (isNewChat) {
      const recipientList = recipientInput
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      
      if (recipientList.length === 0) return;
      
      // For new conversations, we don't pass a conversationId
      onSendMessage(message);
    }
    setMessage("");
  };

  const conversationRecipients = activeConversation?.recipients || [];

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10">
        <ChatHeader
          isNewChat={showRecipientInput}
          recipientInput={recipientInput}
          setRecipientInput={setRecipientInput}
          isMobileView={isMobileView}
          onBack={onBack}
          activeConversation={activeConversation}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0 relative">
        <MessageList
          messages={activeConversation?.messages || []}
          conversation={activeConversation}
          typingStatus={typingStatus}
          conversationId={conversationId}
        />
        <div className="sticky bottom-0 bg-background">
          <MessageInput
            message={message}
            setMessage={setMessage}
            handleSend={handleSend}
            inputRef={messageInputRef}
            disabled={!activeConversation && !isNewChat}
            recipients={conversationRecipients}
          />
        </div>
      </div>
    </div>
  );
}
