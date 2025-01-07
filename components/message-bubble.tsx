import { cn } from "@/lib/utils";
import { Message, ReactionType, Reaction } from "../types";
import { Conversation } from "../types";
import { useCallback, useState, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import Image from "next/image";
import { soundEffects } from "@/lib/sound-effects";

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

const typingAnimation = `
@keyframes blink {
  0% { opacity: 0.3; }
  20% { opacity: 1; }
  100% { opacity: 0.3; }
}
`;

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
  // Determine message sender type and display name
  const isSystemMessage = message.sender === "system";
  const isMe = message.sender === "me";
  const showRecipientName = !isMe && !isSystemMessage;
  const recipientName = showRecipientName ? message.sender : null;

  // Map of reaction types to their SVG paths for the menu
  const { theme, systemTheme } = useTheme();
  const effectiveTheme = theme === "system" ? systemTheme : theme;

  const menuReactionIcons = {
    heart: "/reactions/heart-gray.svg",
    like: "/reactions/like-gray.svg",
    dislike: "/reactions/dislike-gray.svg",
    laugh: "/reactions/laugh-gray.svg",
    emphasize: "/reactions/emphasize-gray.svg",
    question: "/reactions/question-gray.svg",
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
        soundEffects.playReactionSound();

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

  // Helper function to prepare message content by highlighting recipient names
  const prepareContent = (
    content: string,
    recipients: Conversation["recipients"],
    sender: string
  ) => {
    if (!recipients) return content;

    let highlightedContent = content;
    recipients.forEach((recipient) => {
      // Special case for I. M. Pei - only highlight when seeing full initials or last name
      if (recipient.name === "I. M. Pei") {
        const imPeiRegex = new RegExp(
          `\\b(I\\. M\\.|I\\. M\\. Pei|Pei)(?=\\s|$|\\p{P})`,
          "gu"
        );
        highlightedContent = highlightedContent.replace(imPeiRegex, (match) => {
          return `<span class="font-medium ${
            sender === "me" ? "" : "text-[#0A7CFF] dark:text-[#0A7CFF]"
          }">${match}</span>`;
        });
        return; // Skip regular name highlighting for I. M. Pei
      }

      // Special case for Trader Joe's - don't highlight Joe when it's part of "Trader Joe's"
      if (recipient.name === "Joe") {
        const joeRegex = new RegExp(
          `(?<!Trader\\s)\\bJoe\\b(?=\\s|$|\\p{P})`,
          "gu"
        );
        highlightedContent = highlightedContent.replace(joeRegex, (match) => {
          return `<span class="font-medium ${
            sender === "me" ? "" : "text-[#0A7CFF] dark:text-[#0A7CFF]"
          }">${match}</span>`;
        });
        return; // Skip regular name highlighting for Joe
      }

      // Regular case for all other names
      const fullNameRegex = new RegExp(
        `@?\\b${recipient.name}(?=\\s|$|\\p{P})`,
        "giu"
      );
      const firstName = recipient.name.split(" ")[0];
      const firstNameRegex = new RegExp(
        `@?\\b${firstName}(?=\\s|$|\\p{P})`,
        "giu"
      );

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

  const rightBubbleSvg =
    effectiveTheme === "dark"
      ? "/message-bubbles/right-bubble-dark.svg"
      : "/message-bubbles/right-bubble-light.svg";
  const leftBubbleSvg =
    effectiveTheme === "dark"
      ? "/message-bubbles/left-bubble-dark.svg"
      : "/message-bubbles/left-bubble-light.svg";
  const typingIndicatorSvg =
    effectiveTheme === "dark"
      ? "/typing-bubbles/chat-typing-dark.svg"
      : "/typing-bubbles/chat-typing-light.svg";

  const getReactionIconSvg = (
    messageFromMe: boolean,
    reactionType: ReactionType,
    reactionFromMe: boolean
  ) => {
    const orientation = messageFromMe ? "left" : "right";
    const variant = reactionFromMe
      ? effectiveTheme === "dark"
        ? "dark-blue"
        : "light-blue"
      : effectiveTheme === "dark"
      ? "dark"
      : "light";
    return `/reactions/${orientation}-${variant}-${reactionType}.svg`;
  };

  return (
    <div className="flex w-full flex-col relative z-10">
      {/* Spacer before messages */}
      <div className="h-1 bg-background" />
      {/* Extra space between messages with reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="h-2 bg-background" />
      )}

      {/* Show recipient name for messages from others */}
      {recipientName && (
        <div className="text-[10px] text-muted-foreground pl-4 pb-0.5 bg-background">
          {recipientName}
        </div>
      )}

      <div className="flex">
        {/* Left spacer for blue messages */}
        {isMe && <div className="flex-1 bg-background" />}
        {/* Message bubble container */}
        {isSystemMessage ? (
          <div
            className={cn(
              "w-full flex justify-center py-2 px-3",
              isSystemMessage && "bg-background"
            )}
          >
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
                ? "border-[20px] border-solid border-r-[27.7px] text-white"
                : isTyping
                ? "border-[20px] border-solid border-l-[27.7px] bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100"
                : "border-[20px] border-solid border-l-[27.7px] bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-gray-100"
            )}
            style={
              !isSystemMessage
                ? {
                    borderImageSlice: isMe ? "31 43 31 31" : "31 31 31 43",
                    borderImageSource: `url('${
                      isMe
                        ? rightBubbleSvg
                        : isTyping
                        ? typingIndicatorSvg
                        : leftBubbleSvg
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
                    {/* Add this to cover up the right border */}
                    <div
                      className={cn(
                        "absolute border-r-[0.5px] border-background",
                        !isMe || isTyping ? "inset-[-20px]" : "inset-[-27.7px]"
                      )}
                    />
                    <div className="text-sm">
                      {/* Show typing indicator or message content */}
                      {isTyping ? (
                        <div className="w-12 h-4 flex items-center justify-center gap-1">
                          <style>{typingAnimation}</style>
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-300"
                            style={{ animation: "blink 1.4s infinite linear" }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-300"
                            style={{
                              animation: "blink 1.4s infinite linear 0.2s",
                            }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-300"
                            style={{
                              animation: "blink 1.4s infinite linear 0.4s",
                            }}
                          />
                        </div>
                      ) : (
                        prepareContent(
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
                  className="flex p-2 gap-2 min-w-[280px] rounded-full bg-gray-100 dark:bg-[#404040] z-50 reaction-menu"
                  align={isMe ? "end" : "start"}
                  alignOffset={-8}
                  side="top"
                  sideOffset={20}
                >
                  {/* Reaction buttons */}
                  {Object.entries(menuReactionIcons).map(([type, icon]) => (
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
                      <Image
                        src={
                          isReactionActive(type as ReactionType)
                            ? icon
                                .replace("-gray", "-white")
                                .replace("-dark", "-white")
                            : icon
                        }
                        width={16}
                        height={16}
                        alt={`${type} reaction`}
                        style={
                          type === "emphasize"
                            ? { transform: "scale(0.75)" }
                            : type === "question"
                            ? { transform: "scale(0.6)" }
                            : undefined
                        }
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
                    isMe ? "-left-8" : "-right-8",
                    isMe ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  {/* Sort reactions by timestamp to have most recent first in DOM (appears on top) */}
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
                          "w-8 h-8 flex items-center justify-center text-sm relative",
                          reaction.type === justAddedReactionType &&
                            "animate-scale-in",
                          index !== array.length - 1 &&
                            (isMe ? "-mr-7" : "-ml-7"),
                          `z-[${30 - index}]`
                        )}
                        style={{
                          backgroundImage: `url('${getReactionIconSvg(
                            isMe,
                            reaction.type,
                            reaction.sender === "me"
                          )}')`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                      ></div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Right spacer for gray messages */}
        {!isSystemMessage && !isMe && <div className="flex-1 bg-background" />}
      </div>

      {/* Show "Delivered" for last message from current user */}
      {isMe && isLastUserMessage && !isTyping && (
        <div className="text-[10px] text-gray-500 pt-1 pr-1 bg-background text-right">
          <span className={cn(justSent && "animate-scale-in")}>Delivered</span>
        </div>
      )}
      {/* Spacer after messages */}
      <div className="h-1 bg-background" />
    </div>
  );
}
