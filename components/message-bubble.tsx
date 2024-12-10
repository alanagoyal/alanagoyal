import { cn } from "@/lib/utils";
import { Message, ReactionType, Reaction } from "../types";
import { Conversation } from "../types"; 
import { useCallback, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart,
  faThumbsUp,
  faThumbsDown,
  faFaceLaugh,
  faExclamation,
  faQuestion
} from "@fortawesome/free-solid-svg-icons";

// Props for the MessageBubble component
interface MessageBubbleProps {
  message: Message;                   
  isLastUserMessage?: boolean;        
  conversation?: Conversation;      
  isTyping?: boolean;                
  onReaction?: (messageId: string, reaction: Reaction) => void;  
  onOpenChange?: (isOpen: boolean) => void;
}

export function MessageBubble({ 
  message, 
  isLastUserMessage, 
  conversation,
  isTyping,
  onReaction,
  onOpenChange,
}: MessageBubbleProps) {
  // Determine message sender type and display name
  const isSystemMessage = message.sender === "system";
  const showRecipientName = message.sender !== "me" && !isSystemMessage;
  const recipientName = showRecipientName ? message.sender : null;

  // Map of reaction types to their Font Awesome icons
  const reactionIcons = {
    heart: faHeart,
    like: faThumbsUp,
    dislike: faThumbsDown,
    laugh: faFaceLaugh,
    emphasize: faExclamation,
    question: faQuestion
  };

  // State to control the Popover open state
  const [isOpen, setIsOpen] = useState(false);

  // Handler for when a reaction is clicked
  const handleReaction = useCallback((type: ReactionType) => {
    if (onReaction) {
      const reaction: Reaction = {
        type,
        sender: "me",
        timestamp: new Date().toISOString()
      };
      onReaction(message.id, reaction);
      setIsOpen(false);  // Close the popover after clicking
      onOpenChange?.(false); // Also notify parent to remove overlay
    }
  }, [message.id, onReaction, onOpenChange]);

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
        <Popover open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          onOpenChange?.(open);
        }}>
          <PopoverTrigger asChild>
            <div className="flex flex-col cursor-pointer">
              <div className={cn(
                "text-sm",
                isSystemMessage && "text-center text-xs whitespace-pre-line"
              )}>
                {/* Show typing indicator or message content */}
                {isTyping ? (
                  <span className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
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
              className="flex p-2 gap-2 min-w-[280px] rounded-full dark:bg-[#404040] shadow-lg z-50"
              align={message.sender === "me" ? "start" : "end"}
              side="top"
              sideOffset={10}
            >
              {/* Reaction buttons */}
              {Object.entries(reactionIcons).map(([type, icon]) => (
                <button
                  key={type}
                  onClick={() => {
                    handleReaction(type as ReactionType);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center rounded-full w-8 h-8 p-0 cursor-pointer text-base transition-colors focus:outline-none text-gray-500",
                    isReactionActive(type as ReactionType)
                      ? "bg-[#0A7CFF] text-white"
                      : ""
                  )}
                >
                  <FontAwesomeIcon icon={icon} />
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
                <FontAwesomeIcon icon={reactionIcons[reaction.type]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show "Delivered" for last message from current user */}
      {message.sender === "me" && isLastUserMessage && !isTyping && (
        <div className="text-xs text-gray-500 mt-1 mr-1">Delivered</div>
      )}
    </div>
  );
}
