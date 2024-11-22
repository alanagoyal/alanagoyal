import { Message } from "../types";
import { useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";

const messages: Message[] = [
  {
    id: "1",
    content: "good",
    sender: "me",
    timestamp: "9:30 AM",
    isMe: true,
  },
  {
    id: "2",
    content: "have you taken off yet?",
    sender: "other",
    timestamp: "9:31 AM",
    isMe: false,
  },
];

interface ChatAreaProps {
  isNewChat: boolean;
  setIsNewChat: (value: boolean) => void;
}

export function ChatArea({ isNewChat, setIsNewChat }: ChatAreaProps) {
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && recipient.trim()) {
      setIsNewChat(false);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: String(Date.now()),
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen">
      <ChatHeader 
        isNewChat={isNewChat}
        recipient={recipient}
        setRecipient={setRecipient}
        handleCreateChat={handleCreateChat}
        setIsNewChat={setIsNewChat}
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={message.isMe ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={message.isMe
                ? "bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]"
                : "bg-muted rounded-lg px-4 py-2 max-w-[80%]"
              }
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs text-muted-foreground">{message.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
      <MessageInput 
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
      />
    </div>
  );
}
