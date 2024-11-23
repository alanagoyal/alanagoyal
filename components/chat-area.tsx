import { Message, Conversation } from "../types";
import { useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatAreaProps {
  isNewChat: boolean;
  onNewConversation: (recipientInput: string) => void;
  activeConversation?: Conversation;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  onUpdateConversations: (conversation: Conversation) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  isStreaming?: boolean;
}

export function ChatArea({
  isNewChat,
  onNewConversation,
  activeConversation,
  recipientInput,
  setRecipientInput,
  onUpdateConversations,
  isMobileView,
  onBack,
  inputRef,
  isStreaming,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && recipientInput.trim()) {
      onNewConversation(recipientInput.trim());
      setRecipientInput("");
    }
  };

  const handleSend = () => {
    if (!message.trim() || (!activeConversation && !isNewChat)) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    if (activeConversation) {
      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, newMessage],
        lastMessageTime: new Date().toISOString(),
      };
      onUpdateConversations(updatedConversation);
    }

    setMessage("");
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
      <MessageList 
        messages={activeConversation?.messages || []} 
        isStreaming={isStreaming}
        conversation={activeConversation}
      />
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
        disabled={!activeConversation && !isNewChat}
        inputRef={inputRef}
      />
    </div>
  );
}
