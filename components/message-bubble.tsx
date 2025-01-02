import { cn } from "@/lib/utils";
import { Message, ReactionType, Reaction } from "../types";
import { Conversation } from "../types";
import { useCallback, useState, useRef } from "react";
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
  const showRecipientName = message.sender !== "me" && !isSystemMessage;
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

  const rightBubbleSvg = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIg0KCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczphPSJodHRwOi8vbnMuYWRvYmUuY29tL0Fkb2JlU1ZHVmlld2VyRXh0ZW5zaW9ucy8zLjAvIg0KCSB4PSIwcHgiIHk9IjBweCIgd2lkdGg9Ijk0cHgiIGhlaWdodD0iNjhweCIgdmlld0JveD0iMCAwIDk0IDY4IiBvdmVyZmxvdz0idmlzaWJsZSIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgOTQgNjgiDQoJIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGRlZnM+DQo8L2RlZnM+DQo8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMzEuNzMzLDBIMHYzMS43MzNDMCwxNC4yMDgsMTQuMjA4LDAsMzEuNzMzLDB6Ii8+DQo8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMCwzNi4yNjdWNjhoMzEuNzMzQzE0LjIwOCw2OCwwLDUzLjc5MiwwLDM2LjI2N3oiLz4NCjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik00OS44NjcsNjhIOTMuNWMtMTQuNjY3LDAtMjEuNDI2LTUuNjE1LTIzLjIzMS03LjQzNEM2NC43NTIsNjUuMjAzLDU3LjYzNyw2OCw0OS44NjcsNjh6Ii8+DQo8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNNDkuODY3LDBDNjcuMzkzLDAsODEuNiwxNC4yMDgsODEuNiwzMS43MzN2NC41MzNDODEuNiw2NSw5MSw2OCw5My41LDY4VjBINDkuODY3eiIvPg0KPC9zdmc+DQo=`;

  const leftBubbleSvg = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE1LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI5My41cHgiCgkgaGVpZ2h0PSI2OHB4IiB2aWV3Qm94PSIwIDAgOTMuNSA2OCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgOTMuNSA2OCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnIGlkPSJMYXllcl8zIj4KCTxyZWN0IHg9Ii04LjY2NyIgeT0iLTguNDkzIiBmaWxsPSIjRkZGRkZGIiB3aWR0aD0iMTEyIiBoZWlnaHQ9Ijg5LjMzMyIvPgo8L2c+CjxnIGlkPSJMYXllcl8yIj4KPC9nPgo8ZyBpZD0iTGF5ZXJfMSI+Cgk8cGF0aCBmaWxsPSIjRTVFNkVBIiBkPSJNNjEuNzY3LDBINDMuNjMzQzI2LjEwNywwLDExLjksMTQuMjA4LDExLjksMzEuNzMzdjQuNTMzQzExLjksNjUsMi41LDY4LDAsNjgKCQljMTQuNjY3LDAsMjEuNDI2LTUuNjE1LDIzLjIzMS03LjQzNEMyOC43NDgsNjUuMjAzLDM1Ljg2Myw2OCw0My42MzMsNjhoMTguMTMzQzc5LjI5Miw2OCw5My41LDUzLjc5Miw5My41LDM2LjI2N3YtNC41MzMKCQlDOTMuNSwxNC4yMDgsNzkuMjkyLDAsNjEuNzY3LDB6Ii8+CjwvZz4KPC9zdmc+Cg==`;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
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
        <div className="text-[10px] text-muted-foreground ml-4 mb-0.5 bg-background">
          {recipientName}
        </div>
      )}

      {/* Message bubble container */}
      {isSystemMessage ? (
        <div
          className={cn(
            "rounded-[18px] py-2 px-3 max-w-[80%] relative",
            "text-[12px] text-muted-foreground text-center whitespace-pre-line"
          )}
        >
          {message.content}
        </div>
      ) : (
        <div
          className={cn(
            "group relative max-w-[75%] break-words",
            message.sender === "me" ? "ml-auto" : "mr-auto",
            isSystemMessage && "mx-auto max-w-[90%] text-center"
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              "relative",
              message.sender === "me" ? "ml-auto" : "mr-auto",
              isSystemMessage
                ? "bg-muted/50 rounded-lg"
                : message.sender === "me"
                ? "border-[20px] border-solid border-r-[27.7px]"
                : "border-[20px] border-solid border-l-[27.7px] bg-[#E5E6EA]",
              justSent && "animate-pop-in"
            )}
            style={
              !isSystemMessage
                ? {
                    borderImageSlice:
                      message.sender === "me" ? "31 43 31 31" : "31 31 31 43",
                    borderImageSource: `url('${
                      message.sender === "me" ? rightBubbleSvg : leftBubbleSvg
                    }')`,
                  }
                : undefined
            }
          >
            <div className="-m-2">
              {/* Reaction popup menu */}
              <Popover
                open={isOpen}
                modal={true}
                onOpenChange={handleOpenChange}
              >
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
                  align={message.sender === "me" ? "end" : "start"}
                  alignOffset={-8}
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
                        "flex-1 flex items-center justify-center rounded-full w-8 h-8 p-0 cursor-pointer text-base transition-all duration-200 ease-out text-gray-500 hover:scale-125",
                        isReactionActive(type as ReactionType)
                          ? "bg-[#0A7CFF] text-white scale-110"
                          : ""
                      )}
                    >
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
                    "absolute -top-4 flex",
                    message.sender === "me" ? "-left-4" : "-right-4"
                  )}
                >
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
                            : "bg-gray-100 dark:bg-[#404040]",
                          reaction.type === justAddedReactionType &&
                            "animate-scale-in",
                          index !== array.length - 1 && "-mr-7",
                          index === 0 ? "z-30" : index === 1 ? "z-20" : "z-10"
                        )}
                      >
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
        </div>
      )}

      {/* Show "Delivered" for last message from current user */}
      {message.sender === "me" && isLastUserMessage && !isTyping && (
        <div
          className={cn(
            "text-xs text-gray-500 mt-1 mr-1 bg-background",
            justSent && "animate-scale-in"
          )}
        >
          Delivered
        </div>
      )}
    </div>
  );
}
