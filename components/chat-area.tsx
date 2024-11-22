import { Message, Conversation } from "../types";
import { useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";

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
  onUpdateConversations 
}: ChatAreaProps) {
  const [message, setMessage] = useState("");

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && recipient.trim()) {
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
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
        recipient={activeConversation?.recipient || recipient}
        setRecipient={setRecipient}
        handleCreateChat={handleCreateChat}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {activeConversation?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70">{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          disabled={!activeConversation && !isNewChat}
        />
      </div>
    </div>
  );
}
