import { cn } from "@/lib/utils";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
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
        <div className="flex flex-col gap-1">
          <div className="text-sm">{message.content}</div>
          <div className="text-xs text-muted-foreground">{message.timestamp}</div>
        </div>
      </div>
    </div>
  );
}
