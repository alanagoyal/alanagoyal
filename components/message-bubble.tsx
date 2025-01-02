import { cn } from "@/lib/utils";
import { Message, ReactionType, Reaction } from "../types";
import { Conversation } from "../types";
import { useCallback, useState, useRef, useEffect } from "react";
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
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";

// Props for the MessageBubble component
interface MessageBubbleProps {
  message: Message;
  isLastUserMessage?: boolean;
  conversation?: Conversation;
  isTyping?: boolean;
  onReaction?: (messageId: string, reaction: Reaction) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onReactionComplete?: () => void;
  justSent?: boolean;
}

export function MessageBubble({
  message,
  isLastUserMessage,
  conversation,
  isTyping,
  onReaction,
  onOpenChange,
  onReactionComplete,
  justSent = false,
}: MessageBubbleProps) {
  console.log("MessageBubble rendering:", {
    sender: message.sender,
    content: message.content,
  });

  // Determine message sender type and display name
  const isSystemMessage = message.sender === "system";
  const isMe = message.sender === "me";
  const showRecipientName = !isMe && !isSystemMessage;
  const recipientName = showRecipientName ? message.sender : null;

  // Map of reaction types to their Font Awesome icons
  const reactionIcons = {
    heart: faHeart,
    like: faThumbsUp,
    dislike: faThumbsDown,
    laugh: faFaceLaugh,
    emphasize: faExclamation,
    question: faQuestion,
  };

  // State to control the Popover open state and animation
  const [isOpen, setIsOpen] = useState(false);
  const [justAddedReactionType, setJustAddedReactionType] =
    useState<ReactionType | null>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handler for menu state changes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Menu is closing
        setIsOpen(false);
        onOpenChange?.(false);
      } else {
        // Only open if we're not in a closing state
        if (openTimeoutRef.current) {
          clearTimeout(openTimeoutRef.current);
        }
        openTimeoutRef.current = setTimeout(() => {
          setIsOpen(true);
          onOpenChange?.(true);
        }, 10);
      }
    },
    [onOpenChange]
  );

  // Handler for when a reaction is clicked
  const handleReaction = useCallback(
    (type: ReactionType) => {
      if (onReaction) {
        // Create reaction with current timestamp
        const reaction: Reaction = {
          type,
          sender: "me",
          timestamp: new Date().toISOString(),
        };

        // Start reaction animation
        setJustAddedReactionType(type);

        // Clear animation after completion
        setTimeout(() => {
          setJustAddedReactionType(null);
        }, 300);

        // Send reaction to parent
        onReaction(message.id, reaction);

        // Close menu and focus input with delay for animation
        setTimeout(() => {
          setIsOpen(false);
          onOpenChange?.(false);
          onReactionComplete?.();
        }, 150);
      }
    },
    [message.id, onReaction, onOpenChange, onReactionComplete]
  );

  // Check if a specific reaction type is already active for the current user
  const isReactionActive = (type: ReactionType) => {
    return (
      message.reactions?.some((r) => r.type === type && r.sender === "me") ??
      false
    );
  };

  // Helper function to highlight recipient names in message content
  const highlightRecipientNames = (
    content: string,
    recipients: Conversation["recipients"],
    sender: string
  ) => {
    if (!recipients) return content;

    let highlightedContent = content;
    recipients.forEach((recipient) => {
      // Check for full name and first name, with optional @ prefix
      const fullNameRegex = new RegExp(`@?\\b${recipient.name}\\b`, "gi");
      const firstName = recipient.name.split(" ")[0];
      const firstNameRegex = new RegExp(`@?\\b${firstName}\\b`, "gi");

      const colorClass =
        sender === "me" ? "" : "text-[#0A7CFF] dark:text-[#0A7CFF]";

      // Replace names with highlighted spans
      highlightedContent = highlightedContent
        .replace(fullNameRegex, (match) => {
          const name = match.startsWith("@") ? match.slice(1) : match;
          return `<span class="font-medium ${colorClass}">${
            name.charAt(0).toUpperCase() + name.slice(1)
          }</span>`;
        })
        .replace(firstNameRegex, (match) => {
          const name = match.startsWith("@") ? match.slice(1) : match;
          return `<span class="font-medium ${colorClass}">${
            name.charAt(0).toUpperCase() + name.slice(1)
          }</span>`;
        });
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  const { theme } = useTheme();

  const rightBubbleSvg = theme === 'dark' ? '/right-bubble-dark.svg' : '/right-bubble-light.svg';
  const leftBubbleSvg = theme === 'dark' ? '/left-bubble-dark.svg' : '/left-bubble-light.svg';

  return (
    <div
      className={cn(
        "flex w-full flex-col relative z-10"
        // Align messages based on sender
      )}>
      <div className="h-3 bg-background" />

      {/* Show recipient name for messages from others */}
      {recipientName && (
        <div className="text-[10px] text-muted-foreground pl-4 pb-0.5 bg-background">
          {recipientName}
        </div>
      )}

      <div className="flex">
        {isMe && <div className="flex-1 bg-background" />}
        {/* Message bubble container */}
        {isSystemMessage ? (
          <div
            className={cn(
              "w-full flex justify-center py-2 px-3",
              isSystemMessage && "bg-background"
            )}>
            <div className="text-[12px] text-muted-foreground text-center whitespace-pre-line max-w-[80%]">
              {message.content}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "group relative max-w-[75%] break-words flex-none",
              isSystemMessage
                ? "bg-muted/50 rounded-lg text-center"
                : isMe
                ? "border-[20px] border-solid border-r-[27.7px] -mr-[0.5px] text-white"
                : "border-[20px] border-solid border-l-[27.7px] -ml-[0.5px] bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100",
              justSent && "animate-pop-in"
            )}
            style={
              !isSystemMessage
                ? {
                    borderImageSlice: isMe ? "31 43 31 31" : "31 31 31 43",
                    borderImageSource: `url('${isMe ? rightBubbleSvg : leftBubbleSvg}')`,
                  }
                : undefined
            }>
            <div className="-m-2">
              {/* Reaction popup menu */}
              <Popover
                open={isOpen}
                modal={true}
                onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                  <div className="flex flex-col cursor-pointer">
                    <div className="text-sm">
                      {/* Show typing indicator or message content */}
                      {isTyping ? (
                        <span className="typing-indicator">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </span>
                      ) : (
                        highlightRecipientNames(
                          message.content,
                          conversation?.recipients || [],
                          message.sender
                        )
                      )}
                    </div>
                  </div>
                </PopoverTrigger>

                {/* Reaction menu */}
                <PopoverContent
                  className="flex p-2 gap-2 min-w-[280px] rounded-full dark:bg-[#404040] shadow-lg z-50 reaction-menu"
                  align={isMe ? "end" : "start"}
                  alignOffset={-8}
                  side="top"
                  sideOffset={10}>
                  {/* Reaction buttons */}
                  {Object.entries(reactionIcons).map(([type, icon]) => (
                    <button
                      key={type}
                      onClick={() => {
                        handleReaction(type as ReactionType);
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-full w-8 h-8 p-0 cursor-pointer text-base transition-all duration-200 ease-out text-gray-500 hover:scale-125",
                        isReactionActive(type as ReactionType)
                          ? "bg-[#0A7CFF] text-white scale-110"
                          : ""
                      )}>
                      <FontAwesomeIcon
                        icon={icon}
                        className="transition-transform duration-200"
                      />
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Display existing reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div
                  className={cn(
                    "absolute -top-8 flex",
                    isMe ? "-left-8" : "-right-8"
                  )}>
                  {/* Sort reactions by timestamp to have most recent first in DOM (appears on left) */}
                  {[...message.reactions]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((reaction, index, array) => (
                      <div
                        key={`${reaction.type}-${index}`}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm border border-background",
                          reaction.sender === "me"
                            ? "bg-[#0A7CFF]"
                            : "bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100",
                          reaction.type === justAddedReactionType &&
                            "animate-scale-in",
                          index !== array.length - 1 && "-mr-7",
                          index === 0 ? "z-30" : index === 1 ? "z-20" : "z-10"
                        )}>
                        <FontAwesomeIcon
                          icon={reactionIcons[reaction.type]}
                          className={cn(
                            reaction.sender === "me"
                              ? reaction.type === "heart"
                                ? "text-[#FF69B4]"
                                : "text-white"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        {!isSystemMessage && !isMe && <div className="flex-1 bg-background" />}
      </div>
      {/* Show "Delivered" for last message from current user */}
      {isMe && isLastUserMessage && !isTyping && (
        <div
          className={cn(
            "text-[10px] text-gray-500 pt-1 pr-1 bg-background text-right",
            justSent && "animate-scale-in"
          )}>
          Delivered
        </div>
      )}
      <div className="h-3 bg-background" />
    </div>
  );
}
