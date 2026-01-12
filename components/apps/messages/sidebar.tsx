import { useEffect, useState } from "react";
import { Conversation } from "@/types/messages";
import { SearchBar } from "./search-bar";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ConversationItem } from "./conversation-item";
import { Icons } from "./icons";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import Image from "next/image";

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (
    conversations: Conversation[],
    updateType?: "pin" | "mute"
  ) => void;
  isMobileView: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  typingStatus: { conversationId: string; recipient: string } | null;
  onScroll?: (isScrolled: boolean) => void;
  onSoundToggle: () => void;
}

export function Sidebar({
  children,
  conversations,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  isMobileView,
  searchTerm,
  onSearchChange,
  typingStatus,
  onScroll,
  onSoundToggle,
}: SidebarProps) {
  const { theme, systemTheme, setTheme } = useTheme();
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const windowFocus = useWindowFocus();

  const [openSwipedConvo, setOpenSwipedConvo] = useState<string | null>(null);
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = parseISO(timestamp);

      if (isToday(date)) {
        return format(date, "h:mm a"); // e.g. "12:40 AM"
      }

      if (isYesterday(date)) {
        return "Yesterday";
      }

      if (isThisWeek(date)) {
        return format(date, "EEEE"); // e.g. "Sunday"
      }

      return format(date, "M/d/yy"); // e.g. "12/21/24"
    } catch (error) {
      console.error("Error formatting time:", error, timestamp);
      return "Just now";
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getReactionIconSvg = (reactionType: string) => {
    const variant = effectiveTheme === "dark" ? "dark" : "pinned-light";
    return `/messages/reactions/left-${variant}-${reactionType}.svg`;
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    // First sort by pinned status
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // Then sort by timestamp
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA; // Most recent first
  });

  const filteredConversations = sortedConversations.filter((conversation) => {
    if (!searchTerm) return true;

    // Search in non-system messages content only
    const hasMatchInMessages = conversation.messages
      .filter((message) => message.sender !== "system")
      .some((message) =>
        message.content.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Search in recipient names
    const hasMatchInNames = conversation.recipients.some((recipient) =>
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return hasMatchInMessages || hasMatchInNames;
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Check if this app should handle the shortcut
      // In desktop mode (windowFocus exists), check if this window is focused
      // In standalone mode, check if target is within this app
      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        if (!target.closest('[data-app="messages"]')) return;
      }

      // Check if the active element is within a chat header input or dropdown
      const activeElement = document.activeElement;
      const isChatHeaderActive =
        activeElement?.closest('[data-chat-header="true"]') !== null;

      if (isChatHeaderActive) {
        return;
      }

      // For letter shortcuts, check if we're in an input or editor
      if (["j", "k", "p", "d", "t", "s", "h"].includes(e.key)) {
        if (
          document.activeElement?.tagName === "INPUT" ||
          e.metaKey ||
          document
            .querySelector(".ProseMirror")
            ?.contains(document.activeElement)
        ) {
          return;
        }
      }

      // Theme toggle shortcut
      if (e.key === "t") {
        e.preventDefault();
        setTheme(effectiveTheme === "light" ? "dark" : "light");
        return;
      }

      // Sound toggle shortcut
      if (e.key === "s") {
        e.preventDefault();
        onSoundToggle();
        return;
      }

      // Hide/Show alerts shortcut
      if (e.key === "h" && activeConversation) {
        e.preventDefault();
        const updatedConversations = conversations.map((conv) =>
          conv.id === activeConversation
            ? { ...conv, hideAlerts: !conv.hideAlerts }
            : conv
        );
        onUpdateConversation(updatedConversations, "mute");
        return;
      }

      // Focus search on forward slash
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        !document.activeElement?.closest(".ProseMirror")
      ) {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"][placeholder="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Navigation shortcuts - only navigate through filtered conversations
      if (
        (e.key === "ArrowDown" || e.key === "j") &&
        filteredConversations.length > 0
      ) {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(
          (conv) => conv.id === activeConversation
        );

        // If current conversation is not in filtered results, select the first one
        if (currentIndex === -1) {
          onSelectConversation(filteredConversations[0].id);
          const firstConvoButton = document.querySelector(
            `button[aria-current="true"]`
          );
          firstConvoButton?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          return;
        }

        const nextIndex = (currentIndex + 1) % filteredConversations.length;
        onSelectConversation(filteredConversations[nextIndex].id);
        setTimeout(() => {
          const nextConvoButton = document.querySelector(
            `button[aria-current="true"]`
          );
          nextConvoButton?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 0);
      } else if (
        (e.key === "ArrowUp" || e.key === "k") &&
        filteredConversations.length > 0
      ) {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(
          (conv) => conv.id === activeConversation
        );

        // If current conversation is not in filtered results, select the last one
        if (currentIndex === -1) {
          onSelectConversation(
            filteredConversations[filteredConversations.length - 1].id
          );
          const lastConvoButton = document.querySelector(
            `button[aria-current="true"]`
          );
          lastConvoButton?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          return;
        }

        const nextIndex =
          currentIndex - 1 < 0
            ? filteredConversations.length - 1
            : currentIndex - 1;
        onSelectConversation(filteredConversations[nextIndex].id);
        setTimeout(() => {
          const prevConvoButton = document.querySelector(
            `button[aria-current="true"]`
          );
          prevConvoButton?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 0);
      }
      // Action shortcuts
      else if (e.key === "p") {
        e.preventDefault();
        if (!activeConversation) return;

        const updatedConversations = conversations.map((conv) => {
          if (conv.id === activeConversation) {
            return { ...conv, pinned: !conv.pinned };
          }
          return conv;
        });
        onUpdateConversation(updatedConversations, "pin");
      } else if (e.key === "d") {
        e.preventDefault();
        if (!activeConversation) return;
        onDeleteConversation(activeConversation);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeConversation,
    filteredConversations,
    conversations,
    onSelectConversation,
    onUpdateConversation,
    onDeleteConversation,
    windowFocus,
    setTheme,
    effectiveTheme,
    onSoundToggle,
  ]);

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      {children}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
          onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
            const viewport = e.currentTarget.querySelector(
              "[data-radix-scroll-area-viewport]"
            );
            if (viewport) {
              onScroll?.(viewport.scrollTop > 0);
            }
          }}
          isMobile={isMobileView}
          withVerticalMargins={false}
          bottomMargin="0px"
        >
          <div className={`${isMobileView ? "w-full" : "w-[320px]"} px-2`}>
            <SearchBar value={searchTerm} onChange={onSearchChange} />
            <div className="w-full">
              {filteredConversations.length === 0 && searchTerm ? (
                <div className="py-2">
                  <p className="text-sm text-muted-foreground px-2 mt-4">
                    No results found
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned Conversations Grid */}
                  {filteredConversations.some((conv) => conv.pinned) && (
                    <div className="p-2">
                      <div
                        className={`flex flex-wrap gap-1 ${
                          filteredConversations.filter((c) => c.pinned)
                            .length <= 2
                            ? "justify-center"
                            : ""
                        }`}
                        style={{
                          display: "grid",
                          gap: "1rem",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          ...(filteredConversations.filter((c) => c.pinned)
                            .length <= 2 && {
                            display: "flex",
                            maxWidth: "fit-content",
                            margin: "0 auto",
                          }),
                        }}
                      >
                        {filteredConversations
                          .filter((conv) => conv.pinned)
                          .map((conversation) => (
                            <div
                              key={conversation.id}
                              data-conversation-id={conversation.id}
                              className="flex justify-center"
                            >
                              <ContextMenu>
                                <ContextMenuTrigger>
                                  <button
                                    onClick={() =>
                                      onSelectConversation(conversation.id)
                                    }
                                    className={`w-20 aspect-square rounded-lg flex flex-col items-center justify-center p-2 relative ${
                                      activeConversation === conversation.id
                                        ? "bg-[#0A7CFF] text-white"
                                        : ""
                                    }`}
                                  >
                                    <div className="relative">
                                      {typingStatus?.conversationId ===
                                        conversation.id &&
                                      activeConversation !== conversation.id ? (
                                        <div className="absolute -top-4 -right-4 z-30">
                                          <div className="rounded-[16px] px-1.5 py-0 inline-flex items-center relative">
                                            <Image
                                              src={
                                                effectiveTheme === "dark"
                                                  ? "/messages/typing-bubbles/typing-dark.svg"
                                                  : "/messages/typing-bubbles/typing-light.svg"
                                              }
                                              alt="Typing indicator"
                                              width={32}
                                              height={8}
                                              className="scale-[1.2]"
                                            />
                                            <div className="absolute top-[35%] left-[35%] flex gap-[2px]">
                                              <div
                                                style={{
                                                  animation:
                                                    "blink 1.4s infinite linear",
                                                }}
                                                className={`w-1 h-1 bg-gray-500 dark:bg-gray-300 rounded-full`}
                                              ></div>
                                              <div
                                                style={{
                                                  animation:
                                                    "blink 1.4s infinite linear 0.2s",
                                                }}
                                                className={`w-1 h-1 bg-gray-500 dark:bg-gray-300 rounded-full`}
                                              ></div>
                                              <div
                                                style={{
                                                  animation:
                                                    "blink 1.4s infinite linear 0.4s",
                                                }}
                                                className={`w-1 h-1 bg-gray-500 dark:bg-gray-300 rounded-full`}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : conversation.unreadCount > 0 ? (
                                        (() => {
                                          const lastMessage =
                                            conversation.messages
                                              .filter(
                                                (message) =>
                                                  message.sender !== "system"
                                              )
                                              .slice(-1)[0];

                                          if (
                                            lastMessage?.reactions &&
                                            lastMessage.reactions.length > 0 &&
                                            lastMessage.sender !== "me"
                                          ) {
                                            return (
                                              <div className="absolute -top-4 -right-4 flex z-30">
                                                {[...lastMessage.reactions]
                                                  .sort(
                                                    (a, b) =>
                                                      new Date(
                                                        b.timestamp
                                                      ).getTime() -
                                                      new Date(
                                                        a.timestamp
                                                      ).getTime()
                                                  )
                                                  .slice(0, 2)
                                                  .map(
                                                    (
                                                      reaction,
                                                      index,
                                                      array
                                                    ) => (
                                                      <div
                                                        key={`${reaction.type}-${index}`}
                                                        className={cn(
                                                          "w-8 h-8 flex items-center justify-center text-base relative",
                                                          index !==
                                                            array.length - 1 &&
                                                            "-mr-2",
                                                          index === 0
                                                            ? "z-30"
                                                            : "z-20"
                                                        )}
                                                        style={{
                                                          backgroundImage: `url('${getReactionIconSvg(
                                                            reaction.type
                                                          )}')`,
                                                          backgroundSize:
                                                            "contain",
                                                          backgroundRepeat:
                                                            "no-repeat",
                                                          backgroundPosition:
                                                            "center",
                                                        }}
                                                      ></div>
                                                    )
                                                  )}
                                              </div>
                                            );
                                          } else if (
                                            conversation.messages.length > 0
                                          ) {
                                            return (
                                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                                                <div
                                                  className={`rounded-[10px] py-1 px-1.5 ${
                                                    activeConversation ===
                                                    conversation.id
                                                      ? "bg-blue-400/30 text-blue-100"
                                                      : "bg-gray-200/90 dark:bg-[#404040]/90 text-gray-900 dark:text-gray-100"
                                                  }`}
                                                >
                                                  <div className="text-[10px] line-clamp-2 w-[72px] text-center">
                                                    {lastMessage?.content || ""}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()
                                      ) : null}
                                      <div className="w-16 sm:w-14 h-16 sm:h-14 rounded-full overflow-hidden mb-1 shadow-md">
                                        {conversation.recipients[0].avatar ? (
                                          <img
                                            src={
                                              conversation.recipients[0].avatar
                                            }
                                            alt=""
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#9BA1AA] to-[#7D828A] relative">
                                            <span className="relative text-white text-2xl sm:text-xl font-medium">
                                              {getInitials(
                                                conversation.recipients[0].name
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full text-center">
                                      <div className="relative max-w-full inline-flex justify-center">
                                        {conversation.unreadCount > 0 && (
                                          <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#0A7CFF] rounded-full" />
                                        )}
                                        <span className="text-xs truncate max-w-full">
                                          {conversation.name ||
                                            conversation.recipients[0].name}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    className={`focus:bg-[#0A7CFF] focus:text-white ${
                                      isMobileView
                                        ? "flex items-center justify-between"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const updatedConversations =
                                        conversations.map((conv) =>
                                          conv.id === conversation.id
                                            ? { ...conv, pinned: false }
                                            : conv
                                        );
                                      onUpdateConversation(
                                        updatedConversations,
                                        "pin"
                                      );
                                    }}
                                  >
                                    <span>Unpin</span>
                                    {isMobileView && (
                                      <Icons.pinOff className="h-4 w-4 ml-2" />
                                    )}
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    className={`focus:bg-[#0A7CFF] focus:text-white ${
                                      isMobileView
                                        ? "flex items-center justify-between"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const updatedConversations =
                                        conversations.map((conv) =>
                                          conv.id === conversation.id
                                            ? {
                                                ...conv,
                                                hideAlerts: !conv.hideAlerts,
                                              }
                                            : conv
                                        );
                                      onUpdateConversation(
                                        updatedConversations,
                                        "mute"
                                      );
                                    }}
                                  >
                                    <span>
                                      {conversation.hideAlerts
                                        ? "Show Alerts"
                                        : "Hide Alerts"}
                                    </span>
                                    {isMobileView &&
                                      (conversation.hideAlerts ? (
                                        <Icons.bell className="h-4 w-4 ml-2" />
                                      ) : (
                                        <Icons.bellOff className="h-4 w-4 ml-2" />
                                      ))}
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    className={`focus:bg-[#0A7CFF] focus:text-white ${
                                      isMobileView
                                        ? "flex items-center justify-between"
                                        : ""
                                    } text-red-600`}
                                    onClick={() =>
                                      onDeleteConversation(conversation.id)
                                    }
                                  >
                                    <span>Delete</span>
                                    {isMobileView && (
                                      <Icons.trash className="h-4 w-4 ml-2" />
                                    )}
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Conversation List */}
                  {filteredConversations
                    .filter((conv) => !conv.pinned)
                    .map((conversation, index, array) => {
                      const isActive = conversation.id === activeConversation;
                      const nextConversation = array[index + 1];
                      const isNextActive =
                        nextConversation?.id === activeConversation;

                      return (
                        <ConversationItem
                          key={conversation.id}
                          data-conversation-id={conversation.id}
                          conversation={{
                            ...conversation,
                            isTyping:
                              typingStatus?.conversationId === conversation.id,
                          }}
                          activeConversation={activeConversation}
                          onSelectConversation={onSelectConversation}
                          onDeleteConversation={onDeleteConversation}
                          onUpdateConversation={onUpdateConversation}
                          conversations={conversations}
                          formatTime={formatTime}
                          getInitials={getInitials}
                          isMobileView={isMobileView}
                          showDivider={
                            !isActive &&
                            !isNextActive &&
                            index !== array.length - 1
                          }
                          openSwipedConvo={openSwipedConvo}
                          setOpenSwipedConvo={setOpenSwipedConvo}
                        />
                      );
                    })}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
