import { cn } from "@/lib/utils";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isLastUserMessage?: boolean;
}

export function MessageBubble({ message, isLastUserMessage }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-2 flex-col",
        message.sender === "me" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "rounded-[20px] px-4 py-2 max-w-[80%]",
          message.sender === "me"
            ? "bg-[#0A7CFF] text-white"
            : "bg-gray-200 text-gray-900"
        )}
      >
        <div className="flex flex-col">
          <div className="text-sm">{message.content}</div>
        </div>
      </div>
      {message.sender === "me" && isLastUserMessage && (
        <div className="text-xs text-gray-500 mt-1 mr-1">Delivered</div>
      )}
    </div>
  );
}
