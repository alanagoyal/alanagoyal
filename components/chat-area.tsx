import { Conversation } from "../types";
import { useState, useEffect, useRef } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatAreaProps {
  isNewChat: boolean;
  onNewConversation: (recipientInput: string) => void;
  activeConversation?: Conversation;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  isStreaming?: boolean;
  typingParticipant?: string | null;
  onSendMessage: (message: string, conversationId: string) => void;
}

export function ChatArea({
  isNewChat,
  onNewConversation,
  activeConversation,
  recipientInput,
  setRecipientInput,
  isMobileView,
  onBack,
  isStreaming,
  typingParticipant,
  onSendMessage,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when conversation becomes active
    if (activeConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [activeConversation]);

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && recipientInput.trim()) {
      onNewConversation(recipientInput.trim());
      setRecipientInput("");
    }
  };

  const handleSend = () => {
    if (!message.trim() || (!activeConversation && !isNewChat)) return;
    
    if (activeConversation) {
      onSendMessage(message, activeConversation.id);
      setMessage("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        isNewChat={isNewChat}
        recipientInput={recipientInput}
        setRecipientInput={setRecipientInput}
        handleCreateChat={handleCreateChat}
        isMobileView={isMobileView}
        onBack={onBack}
        activeConversation={activeConversation}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList
          messages={activeConversation?.messages || []}
          conversation={activeConversation}
          isStreaming={isStreaming}
          typingParticipant={typingParticipant}
        />
        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          inputRef={messageInputRef}
          disabled={!activeConversation && !isNewChat} // Only disable if there's no conversation and it's not a new chat
        />
      </div>
    </div>
  );
}
