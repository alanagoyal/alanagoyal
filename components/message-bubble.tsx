import { cn } from "@/lib/utils";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-2",
        message.sender === "me" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-2 max-w-[80%]",
          message.sender === "me"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-900"
        )}
      >
        <div className="flex flex-col">
          <div className="text-sm">{message.content}</div>
        </div>
      </div>
    </div>
  );
}
