import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Conversation } from "@/types/messages";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Icons } from "./icons";
import { useTheme } from "next-themes";

interface ConversationItemProps {
  conversation: Conversation;
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (conversations: Conversation[], updateType?: 'pin' | 'mute') => void;
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
  const { theme, systemTheme } = useTheme();
  const effectiveTheme = theme === "system" ? systemTheme : theme;

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
    onUpdateConversation(updatedConversations, 'pin');
    setOpenSwipedConvo(null);
  };

  const handleSwipeDelete = () => {
    if (!isSwipeOpen) return;
    onDeleteConversation(conversation.id);
    setOpenSwipedConvo(null);
  };

  const handleSwipeHideAlerts = () => {
    if (!isSwipeOpen) return;
    handleContextMenuHideAlerts();
    setOpenSwipedConvo(null);
  };

  const handleContextMenuPin = () => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
    );
    onUpdateConversation(updatedConversations, 'pin');
  };

  const handleContextMenuDelete = () => {
    onDeleteConversation(conversation.id);
  };

  const handleContextMenuHideAlerts = () => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id
        ? { ...conv, hideAlerts: !conv.hideAlerts }
        : conv
    );
    onUpdateConversation(updatedConversations, 'mute');
  };

  const ConversationContent = (
    <button
      onClick={() => onSelectConversation(conversation.id)}
      aria-label={`Conversation with ${conversation.recipients
        .map((r) => r.name)
        .join(", ")}`}
      aria-current={activeConversation === conversation.id ? "true" : undefined}
      className={`w-full h-[70px] py-2 text-left relative flex items-center ${
        activeConversation === conversation.id && !isMobileView
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
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {conversation.recipients[0].avatar ? (
            <img
              src={conversation.recipients[0].avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#9BA1AA] to-[#7D828A] relative">
              <span className="relative text-white text-md font-medium">
                {getInitials(conversation.recipients[0].name)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium line-clamp-1 max-w-[70%]">
              {conversation.name || conversation.recipients.map((r) => r.name).join(", ")}
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
            className={`text-xs h-8 flex items-start justify-between ${
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
                        ? "/messages/typing-bubbles/typing-blue.svg"
                        : effectiveTheme === "dark"
                        ? "/messages/typing-bubbles/typing-dark.svg"
                        : "/messages/typing-bubbles/typing-light.svg"
                    }
                    alt="typing"
                    className="w-[45px] h-auto"
                  />
                  <div className="absolute top-[40%] left-[35%] flex gap-[2px]">
                    <div
                      style={{ animation: "blink 1.4s infinite linear" }}
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-gray-500 dark:bg-gray-300"
                      } rounded-full`}
                    ></div>
                    <div
                      style={{ animation: "blink 1.4s infinite linear 0.2s" }}
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-gray-500 dark:bg-gray-300"
                      } rounded-full`}
                    ></div>
                    <div
                      style={{ animation: "blink 1.4s infinite linear 0.4s" }}
                      className={`w-1 h-1 ${
                        activeConversation === conversation.id
                          ? "bg-blue-100"
                          : "bg-gray-500 dark:bg-gray-300"
                      } rounded-full`}
                    ></div>
                  </div>
                </div>
              </div>
            ) : conversation.messages.length > 0 ? (
              <div className="flex items-center gap-2 w-full">
                <div className="line-clamp-2 flex-1">
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
                {conversation.hideAlerts && (
                  <Icons.bellOff
                    className={`flex-shrink-0 h-3 w-3 ${
                      activeConversation === conversation.id 
                        ? "text-white/80" 
                        : "text-muted-foreground"
                    }`} 
                  />
                )}
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
              onHideAlerts={handleSwipeHideAlerts}
              isPinned={conversation.pinned}
              hideAlerts={conversation.hideAlerts}
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
            {isMobileView && <Icons.pin className="h-4 w-4 ml-2" />}
          </ContextMenuItem>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white ${
              isMobileView ? "flex items-center justify-between" : ""
            }`}
            onClick={handleContextMenuHideAlerts}
          >
            <span>{conversation.hideAlerts ? "Show Alerts" : "Hide Alerts"}</span>
            {isMobileView && (
              conversation.hideAlerts ? 
                <Icons.bell className="h-4 w-4 ml-2" /> :
                <Icons.bellOff className="h-4 w-4 ml-2" />
            )}
          </ContextMenuItem>
          <ContextMenuItem
            className={`focus:bg-[#0A7CFF] focus:text-white ${
              isMobileView ? "flex items-center justify-between" : ""
            } text-red-600`}
            onClick={handleContextMenuDelete}
          >
            <span>Delete</span>
            {isMobileView && <Icons.trash className="h-4 w-4 ml-2" />}
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
            className={`focus:bg-[#0A7CFF] focus:text-white focus:rounded-md`}
            onClick={handleContextMenuHideAlerts}
          >
            <span>{conversation.hideAlerts ? "Show Alerts" : "Hide Alerts"}</span>
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
