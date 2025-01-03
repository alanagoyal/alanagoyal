import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Conversation } from "../types";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Pin, Trash } from "lucide-react";
import { useTheme } from "next-themes";

interface ConversationItemProps {
  conversation: Conversation;
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (conversations: Conversation[]) => void;
  conversations: Conversation[];
  formatTime: (timestamp: string | undefined) => string;
  getInitials: (name: string) => string;
  isMobileView?: boolean;
  showDivider?: boolean;
  openSwipedConvo: string | null;
  setOpenSwipedConvo: (id: string | null) => void;
}

export function ConversationItem({
  conversation,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  conversations,
  formatTime,
  getInitials,
  isMobileView,
  showDivider,
  openSwipedConvo,
  setOpenSwipedConvo,
}: ConversationItemProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const isSwipeOpen = openSwipedConvo === conversation.id;
  const { theme } = useTheme();
  const effectiveTheme = theme === 'system' ? 'light' : theme;

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwiping && e.cancelable) {
        // Only prevent default if the touch movement is more horizontal than vertical
        const touch = e.touches[0];
        const prevTouch = e.targetTouches[0];
        if (prevTouch) {
          const xDiff = Math.abs(touch.clientX - prevTouch.clientX);
          const yDiff = Math.abs(touch.clientY - prevTouch.clientY);
          if (xDiff > yDiff) {
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isSwiping]);

  const handlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => {
      setOpenSwipedConvo(conversation.id);
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setOpenSwipedConvo(null);
      setIsSwiping(false);
    },
    trackMouse: true,
  });

  const handleSwipePin = () => {
    if (!isSwipeOpen) return;
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
    );
    onUpdateConversation(updatedConversations);
    setOpenSwipedConvo(null);
  };

  const handleSwipeDelete = () => {
    if (!isSwipeOpen) return;
    onDeleteConversation(conversation.id);
    setOpenSwipedConvo(null);
  };

  const handleContextMenuPin = () => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
    );
    onUpdateConversation(updatedConversations);
  };

  const handleContextMenuDelete = () => {
    onDeleteConversation(conversation.id);
  };

  const ConversationContent = (
    <button
      onClick={() => onSelectConversation(conversation.id)}
      aria-label={`Conversation with ${conversation.recipients
        .map((r) => r.name)
        .join(", ")}`}
      aria-current={activeConversation === conversation.id ? "true" : undefined}
      className={`w-full h-[70px] py-2 text-left relative flex items-center ${
        activeConversation === conversation.id
          ? "bg-[#0A7CFF] text-white rounded-md"
          : ""
      } ${
        showDivider
          ? 'after:content-[""] after:absolute after:bottom-0 after:left-[56px] after:right-4 after:border-t after:border-muted-foreground/20'
          : ""
      }`}
    >
      {conversation.unreadCount > 0 && (
        <div className="absolute left-0.5 w-2.5 h-2.5 bg-[#0A7CFF] rounded-full flex-shrink-0" />
      )}
      <div className="flex items-center gap-2 w-full px-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          {conversation.recipients[0].avatar ? (
            <img
              src={conversation.recipients[0].avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-400 dark:via-gray-500 dark:to-gray-400 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-10 pointer-events-none" />
              <span className="relative text-white text-base font-medium">
                {getInitials(conversation.recipients[0].name)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium line-clamp-1 max-w-[70%]">
              {conversation.recipients.map((r) => r.name).join(", ")}
            </span>
            {conversation.lastMessageTime && (
              <span
                className={`text-xs ml-2 flex-shrink-0 ${
                  activeConversation === conversation.id
                    ? "text-white/80"
                    : "text-muted-foreground"
                }`}
              >
                {formatTime(conversation.lastMessageTime)}
              </span>
            )}
          </div>
          <div
            className={`text-xs h-8 ${
              activeConversation === conversation.id
                ? "text-white/80"
                : "text-muted-foreground"
            }`}
          >
            {conversation.isTyping ? (
              <div className="flex items-center py-0.5">
                <div className="relative">
                  <img
                    src={
                      activeConversation === conversation.id
                        ? "/typing-blue.svg"
                        : effectiveTheme === "dark"
                        ? "/typing-dark.svg"
                        : "/typing-light.svg"
                    }
                    alt="typing"
                    className="w-[45px] h-auto"
                  />
                  <div className="absolute top-[42%] left-[38%] flex gap-[2px]">
                    <div
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-current"
                      } rounded-full animate-bounce [animation-delay:-0.3s]`}
                    ></div>
                    <div
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-current"
                      } rounded-full animate-bounce [animation-delay:-0.15s]`}
                    ></div>
                    <div
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-current"
                      } rounded-full animate-bounce`}
                    ></div>
                  </div>
                </div>
              </div>
            ) : conversation.messages.length > 0 ? (
              <div className="line-clamp-2">
                {(() => {
                  const lastMessage = conversation.messages
                    .filter((message) => message.sender !== "system")
                    .slice(-1)[0];

                  if (!lastMessage) return "";

                  // Check if the last message has any reaction
                  const lastReaction = lastMessage.reactions?.[0];
                  if (lastReaction) {
                    const reactionText = {
                      heart: "loved",
                      like: "liked",
                      dislike: "disliked",
                      laugh: "laughed at",
                      emphasize: "emphasized",
                      question: "questioned",
                    }[lastReaction.type];

                    return lastReaction.sender === "me"
                      ? `You ${reactionText} "${lastMessage.content}"`
                      : `${
                          lastReaction.sender.split(" ")[0]
                        } ${reactionText} "${lastMessage.content}"`;
                  }

                  return lastMessage.content;
                })()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );

  if (isMobileView) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div {...handlers} className="relative overflow-hidden">
            <div
              className={`transition-transform duration-300 ease-out w-full ${
                isSwipeOpen ? "transform -translate-x-24" : ""
              }`}
            >
              {ConversationContent}
            </div>
            <SwipeActions
              isOpen={isSwipeOpen}
              onPin={handleSwipePin}
              onDelete={handleSwipeDelete}
              isPinned={conversation.pinned}
              aria-hidden={!isSwipeOpen}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white ${
              isMobileView ? "flex items-center justify-between" : ""
            }`}
            onClick={handleContextMenuPin}
          >
            <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
            {isMobileView && <Pin className="h-4 w-4 ml-2" />}
          </ContextMenuItem>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white ${
              isMobileView ? "flex items-center justify-between" : ""
            } text-red-600`}
            onClick={handleContextMenuDelete}
          >
            <span>Delete</span>
            {isMobileView && <Trash className="h-4 w-4 ml-2" />}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  } else {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="w-full">
          {ConversationContent}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white focus:rounded-md`}
            onClick={handleContextMenuPin}
          >
            <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
          </ContextMenuItem>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white focus:rounded-md text-red-600`}
            onClick={handleContextMenuDelete}
          >
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
}
