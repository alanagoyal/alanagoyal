import { cn } from "@/lib/utils";
import { Message } from "../types";
import { Conversation } from "../types"; 

interface MessageBubbleProps {
  message: Message;
  isLastUserMessage?: boolean;
  isStreaming?: boolean;
  conversation?: Conversation;
  typingParticipant?: string | null;
}

export function MessageBubble({ 
  message, 
  isLastUserMessage, 
  isStreaming, 
  conversation,
  typingParticipant 
}: MessageBubbleProps) {
  const showRecipientName = conversation && conversation.recipients.length >= 2 && message.sender !== "me";
  const recipientName = showRecipientName 
    ? message.sender
    : null;

  const isTyping = typingParticipant === message.sender && isStreaming;

  return (
    <div
      className={cn(
        "flex w-full mb-2 flex-col",
        message.sender === "me" ? "items-end" : "items-start"
      )}
    >
      {recipientName && (
        <div className="text-xs text-muted-foreground ml-4 mb-1">{recipientName}</div>
      )}
      <div
        className={cn(
          "rounded-[20px] px-4 py-2 max-w-[80%]",
          message.sender === "me"
            ? "bg-[#0A7CFF] text-white"
            : "bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100",
          isStreaming && message.sender !== "me" && "min-h-[32px] min-w-[60px]"
        )}
      >
        <div className="flex flex-col">
          <div className="text-sm">
            {isTyping ? (
              <span className="typing-indicator">
                <span className="dot">•</span>
                <span className="dot">•</span>
                <span className="dot">•</span>
              </span>
            ) : (
              message.content
            )}
          </div>
        </div>
      </div>
      {message.sender === "me" && isLastUserMessage && (
        <div className="text-xs text-gray-500 mt-1 mr-1">Delivered</div>
      )}

      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 20px;
        }
        .dot {
          font-size: 24px;
          line-height: 1;
          animation: typing 1.4s infinite;
          opacity: 0.3;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
