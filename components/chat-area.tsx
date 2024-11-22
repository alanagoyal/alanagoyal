import { Message, Conversation } from "../types";
import { useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatAreaProps {
  isNewChat: boolean;
  setIsNewChat: (value: boolean) => void;
  onNewConversation: (recipient: string) => void;
  activeConversation?: Conversation;
  recipient: string;
  setRecipient: (value: string) => void;
  onUpdateConversations: (conversation: Conversation) => void;
}

export function ChatArea({
  isNewChat,
  setIsNewChat,
  onNewConversation,
  activeConversation,
  recipient,
  setRecipient,
  onUpdateConversations,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && recipient.trim()) {
      onNewConversation(recipient.trim());
      setRecipient("");
      setIsNewChat(false);
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
    <div className="flex-1 flex flex-col">
      <ChatHeader
        isNewChat={isNewChat}
        recipient={activeConversation?.recipient.name || recipient}
        setRecipient={setRecipient}
        handleCreateChat={handleCreateChat}
      />
      <MessageList messages={activeConversation?.messages || []} />
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
        disabled={!activeConversation && !isNewChat}
      />
    </div>
  );
}
