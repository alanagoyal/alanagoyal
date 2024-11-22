import { ScrollArea } from "./ui/scroll-area";
import { Message } from "../types";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(msg => msg.sender === "me");

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            isLastUserMessage={index === lastUserMessageIndex}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
