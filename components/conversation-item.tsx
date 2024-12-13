import { useState } from "react";
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
}: ConversationItemProps) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setIsSwipeOpen(true),
    onSwipedRight: () => setIsSwipeOpen(false),
    trackMouse: true,
  });

  const handlePin = () => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
    );
    onUpdateConversation(updatedConversations);
    setIsSwipeOpen(false);
  };

  const handleDelete = () => {
    onDeleteConversation(conversation.id);
    setIsSwipeOpen(false);
  };

  const ConversationContent = (
    <button
      onClick={() => onSelectConversation(conversation.id)}
      className={`w-full h-[70px] py-2 text-left relative flex items-center ${
        activeConversation === conversation.id
          ? "bg-blue-500 text-white rounded-md"
          : ""
      } ${
        showDivider
          ? "after:content-[\"\"] after:absolute after:bottom-0 after:left-[56px] after:right-4 after:border-t after:border-muted-foreground/20"
          : ""
      }`}
    >
      {conversation.unreadCount > 0 && (
        <div className="absolute left-0.3 w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
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
            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-medium">
              {getInitials(conversation.recipients[0].name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium truncate max-w-[70%]">
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
                <div className={`rounded-[16px] px-1.5 py-0 inline-flex items-center ${
                  activeConversation === conversation.id
                    ? "bg-blue-400/30 text-blue-100"
                    : "bg-gray-200 dark:bg-[#404040] text-gray-900 dark:text-gray-100"
                }`}>
                  <span className="typing-indicator scale-[0.6]">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </span>
                </div>
              </div>
            ) : conversation.messages.length > 0 ? (
              <div className="truncate">
                {(() => {
                  const lastMessage = conversation.messages
                    .filter((message) => message.sender !== "system")
                    .slice(-1)[0];
                  
                  if (!lastMessage) return "";
                  
                  // Check if the last message has a reaction from the current user
                  const lastReaction = lastMessage.reactions?.find(r => r.sender === "me");
                  if (lastReaction) {
                    const reactionText = {
                      heart: "loved",
                      like: "liked",
                      dislike: "disliked",
                      laugh: "laughed at",
                      emphasize: "emphasized",
                      question: "questioned"
                    }[lastReaction.type];
                    
                    return `You ${reactionText} "${lastMessage.content}"`;
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
        <ContextMenuTrigger>
          <div {...handlers} className="relative overflow-hidden">
            <div
              className={`transition-transform duration-300 ease-out ${
                isSwipeOpen ? "transform -translate-x-16" : ""
              }`}
            >
              {ConversationContent}
            </div>
            <SwipeActions
              isOpen={isSwipeOpen}
              onDelete={handleDelete}
              onPin={handlePin}
              isPinned={conversation.pinned}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''}`}
            onClick={handlePin}
          >
            <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
            {isMobileView && <Pin className="h-4 w-4 ml-2" />}
          </ContextMenuItem>
          <ContextMenuItem
            className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''} text-red-600`}
            onClick={() => onDeleteConversation(conversation.id)}
          >
            <span>Delete</span>
            {isMobileView && <Trash className="h-4 w-4 ml-2" />}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">
        {ConversationContent}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''}`}
          onClick={handlePin}
        >
          <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
          {isMobileView && <Pin className="h-4 w-4 ml-2" />}
        </ContextMenuItem>
        <ContextMenuItem
          className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''} text-red-600`}
          onClick={() => onDeleteConversation(conversation.id)}
        >
          <span>Delete</span>
          {isMobileView && <Trash className="h-4 w-4 ml-2" />}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
