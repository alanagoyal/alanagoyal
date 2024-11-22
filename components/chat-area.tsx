import { Icons } from "./icons";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Message } from "../types";
import { InfoIcon } from "lucide-react";
import { useState } from "react";

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
  // Add more messages as needed
];

interface ChatAreaProps {
  isNewChat: boolean;
  setIsNewChat: (value: boolean) => void;
}

export default function ChatArea({ isNewChat, setIsNewChat }: ChatAreaProps) {
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [recipient, setRecipient] = useState("");

  const handleCreateChat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && recipient.trim()) {
      setIsNewChat(false);
      setChatMessages([]);
      setRecipient(recipient.trim());
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen">
      <div className="flex items-center justify-between p-4 h-16 border-b">
        {isNewChat ? (
          <div className="flex-1">
            <input
              type="text"
              placeholder="To:"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onKeyDown={handleCreateChat}
              className="w-full bg-transparent focus:outline-none"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{recipient || "Ankur 💙"}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-muted rounded-lg"
            onClick={() => {
              setIsNewChat(true);
              setRecipient("");
              setChatMessages([]);
            }}
          >
            <Icons.info />
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isMe ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="iMessage"
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
          <button className="p-2 hover:bg-muted rounded-lg">
            <Icons.smile />
          </button>
        </div>
      </div>
    </div>
  );
}
