import { cn } from "@/lib/utils";
import { Message } from "../types";
import { Conversation } from "../types"; 

interface MessageBubbleProps {
  message: Message;
  isLastUserMessage?: boolean;
  conversation?: Conversation;
  isTyping?: boolean;
}

export function MessageBubble({ 
  message, 
  isLastUserMessage, 
  conversation,
  isTyping,
}: MessageBubbleProps) {
  const isSystemMessage = message.sender === "system";
  const showRecipientName = message.sender !== "me" && !isSystemMessage;
  const recipientName = showRecipientName ? message.sender : null;

  const highlightRecipientNames = (content: string, recipients: Conversation['recipients']) => {
    if (!recipients) return content;
    
    let highlightedContent = content;
    recipients.forEach(recipient => {
      // Check for full name and first name, with optional @ prefix
      const fullNameRegex = new RegExp(`@?\\b${recipient.name}\\b`, 'gi');
      const firstName = recipient.name.split(' ')[0];
      const firstNameRegex = new RegExp(`@?\\b${firstName}\\b`, 'gi');
      
      highlightedContent = highlightedContent
        .replace(fullNameRegex, match => {
          const name = match.startsWith('@') ? match.slice(1) : match;
          return `<span class="font-medium">${name}</span>`;
        })
        .replace(firstNameRegex, match => {
          const name = match.startsWith('@') ? match.slice(1) : match;
          return `<span class="font-medium">${name}</span>`;
        });
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  return (
    <div
      className={cn(
        "flex w-full mb-2 flex-col",
        isSystemMessage 
          ? "items-center" 
          : message.sender === "me" 
            ? "items-end" 
            : "items-start"
      )}
    >
      {recipientName && (
        <div className="text-xs text-muted-foreground ml-4 mb-1">{recipientName}</div>
      )}
      <div
        className={cn(
          "rounded-[20px] px-4 py-2 max-w-[80%]",
          isSystemMessage
            ? "text-xs text-muted-foreground"
            : message.sender === "me"
              ? "bg-[#0A7CFF] text-white"
              : "bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100",
          isTyping && "min-h-[32px] min-w-[60px]"
        )}
      >
        <div className="flex flex-col">
          <div className={cn(
            "text-sm",
            isSystemMessage && "text-center text-xs whitespace-pre-line"
          )}>
            {isTyping ? (
              <span className="typing-indicator">
                <span className="dot">•</span>
                <span className="dot">•</span>
                <span className="dot">•</span>
              </span>
            ) : (
              isSystemMessage 
                ? message.content
                : highlightRecipientNames(message.content, conversation?.recipients || [])
            )}
          </div>
        </div>
      </div>
      {message.sender === "me" && isLastUserMessage && !isTyping && (
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
