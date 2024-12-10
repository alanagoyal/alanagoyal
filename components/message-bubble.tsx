import { cn } from "@/lib/utils";
import { Message, ReactionType, Reaction } from "../types";
import { Conversation } from "../types"; 
import { useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Props for the MessageBubble component
interface MessageBubbleProps {
  message: Message;                   
  isLastUserMessage?: boolean;        
  conversation?: Conversation;      
  isTyping?: boolean;                
  onReaction?: (messageId: string, reaction: Reaction) => void;  
}

export function MessageBubble({ 
  message, 
  isLastUserMessage, 
  conversation,
  isTyping,
  onReaction,
}: MessageBubbleProps) {
  // Determine message sender type and display name
  const isSystemMessage = message.sender === "system";
  const showRecipientName = message.sender !== "me" && !isSystemMessage;
  const recipientName = showRecipientName ? message.sender : null;

  // Map of reaction types to their emoji representations
  const reactionEmojis: Record<ReactionType, string> = {
    heart: "❤️",
    like: "👍",
    dislike: "👎",
    laugh: "😂",
    emphasize: "‼️",
    question: "❓"
  };

  // Handler for when a reaction is clicked
  const handleReaction = useCallback((type: ReactionType) => {
    if (onReaction) {
      const reaction: Reaction = {
        type,
        sender: "me",
        timestamp: new Date().toISOString()
      };
      onReaction(message.id, reaction);
    }
  }, [message.id, onReaction]);

  // Check if a specific reaction type is already active for the current user
  const isReactionActive = (type: ReactionType) => {
    return message.reactions?.some(r => r.type === type && r.sender === "me") ?? false;
  };

  // Helper function to highlight recipient names in message content
  const highlightRecipientNames = (content: string, recipients: Conversation['recipients']) => {
    if (!recipients) return content;
    
    let highlightedContent = content;
    recipients.forEach(recipient => {
      // Check for full name and first name, with optional @ prefix
      const fullNameRegex = new RegExp(`@?\\b${recipient.name}\\b`, 'gi');
      const firstName = recipient.name.split(' ')[0];
      const firstNameRegex = new RegExp(`@?\\b${firstName}\\b`, 'gi');
      
      // Replace names with highlighted spans
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
        // Align messages based on sender
        isSystemMessage 
          ? "items-center" 
          : message.sender === "me" 
            ? "items-end" 
            : "items-start"
      )}
    >
      {/* Show recipient name for messages from others */}
      {recipientName && (
        <div className="text-xs text-muted-foreground ml-4 mb-1">{recipientName}</div>
      )}

      {/* Message bubble container */}
      <div
        className={cn(
          "rounded-[20px] px-4 py-2 max-w-[80%] relative group",
          // Style message based on sender type
          isSystemMessage
            ? "text-xs text-muted-foreground"
            : message.sender === "me"
              ? "bg-[#0A7CFF] text-white"
              : "bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100",
          isTyping && "min-h-[32px] min-w-[60px]"
        )}
      >
        {/* Reaction popup menu */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col cursor-pointer">
              <div className={cn(
                "text-sm",
                isSystemMessage && "text-center text-xs whitespace-pre-line"
              )}>
                {/* Show typing indicator or message content */}
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
          </PopoverTrigger>

          {/* Reaction menu for non-system messages */}
          {!isSystemMessage && !isTyping && (
            <PopoverContent 
              className="flex p-2 gap-2 min-w-[280px] bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-lg"
              align={message.sender === "me" ? "start" : "end"}
              side="top"
              sideOffset={-10}
            >
              {/* Reaction buttons */}
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <button
                  key={type}
                  onClick={() => {
                    handleReaction(type as ReactionType);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center rounded-full w-8 h-8 p-0 cursor-pointer text-base transition-colors",
                    isReactionActive(type as ReactionType)
                      ? "bg-[#0A7CFF] text-white"
                      : ""
                  )}
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          )}
        </Popover>

        {/* Display existing reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            "absolute -top-4 flex gap-0.5",
            message.sender === "me" ? "-left-4" : "-right-4"
          )}>
            {message.reactions.map((reaction, index) => (
              <div
                key={`${reaction.type}-${index}`}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                  message.sender === "me" 
                    ? "bg-gray-100 dark:bg-[#404040]" 
                    : "bg-[#0A7CFF] text-white"
                )}
              >
                {reactionEmojis[reaction.type]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show "Delivered" for last message from current user */}
      {message.sender === "me" && isLastUserMessage && !isTyping && (
        <div className="text-xs text-gray-500 mt-1 mr-1">Delivered</div>
      )}

      {/* Typing indicator animation styles */}
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 20px;
        }
        .dot {
          animation: typing 1.5s infinite;
          margin: 0 2px;
          opacity: 0.3;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
