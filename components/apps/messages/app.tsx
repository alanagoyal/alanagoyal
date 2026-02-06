import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect, useRef, useCallback } from "react";
import { Nav } from "./nav";
import { Conversation, Message, Reaction } from "@/types/messages";
import { v4 as uuidv4 } from "uuid";
import { initialConversations } from "@/data/messages/initial-conversations";
import { MessageQueue } from "@/lib/messages/message-queue";
import { soundEffects, shouldMuteIncomingSound } from "@/lib/messages/sound-effects";
import { extractMessageContent } from "@/lib/messages/content";
import { useWindowFocus } from "@/lib/window-focus-context";
import { useFileMenu } from "@/lib/file-menu-context";
import { loadMessagesConversation, saveMessagesConversation } from "@/lib/sidebar-persistence";

interface AppProps {
  isDesktop?: boolean;
  inShell?: boolean; // When true, prevent URL updates (for mobile shell)
  focusModeActive?: boolean; // When true, mute all notifications and sounds
}

export default function App({ isDesktop = false, inShell = false, focusModeActive = false }: AppProps) {
  // Helper to conditionally update URL (skip in desktop mode or shell mode)
  const updateUrl = useCallback(
    (url: string) => {
      if (!isDesktop && !inShell) {
        window.history.pushState({}, "", url);
      }
    },
    [isDesktop, inShell]
  );

  // State
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [lastActiveConversation, setLastActiveConversation] = useState<
    string | null
  >(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>(
    {}
  );
  const [recipientInput, setRecipientInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [typingStatus, setTypingStatus] = useState<{
    conversationId: string;
    recipient: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to track focusModeActive for use in callbacks
  const focusModeRef = useRef(focusModeActive);
  const windowFocus = useWindowFocus();
  const fileMenu = useFileMenu();

  // Keep focusModeRef in sync with prop
  useEffect(() => {
    focusModeRef.current = focusModeActive;
  }, [focusModeActive]);
  const STORAGE_KEY = "dialogueConversations";
  const DELETED_INITIAL_KEY = "dialogueDeletedInitialConversations";

  // Memoized conversation selection method
  const selectConversation = useCallback(
    (conversationId: string | null) => {
      // If clearing the selection
      if (conversationId === null) {
        setActiveConversation(null);
        updateUrl("/messages");
        return;
      }

      // Find the conversation in the list
      const selectedConversation = conversations.find(
        (conversation) => conversation.id === conversationId
      );

      // If conversation is not found, handle gracefully
      if (!selectedConversation) {
        console.error(`Conversation with ID ${conversationId} not found`);

        // Clear URL and select first available conversation
        updateUrl("/messages");

        if (conversations.length > 0) {
          const fallbackConversation = conversations[0];
          setActiveConversation(fallbackConversation.id);
          updateUrl(`?id=${fallbackConversation.id}`);
        } else {
          setActiveConversation(null);
        }
        return;
      }

      // Successfully select the conversation
      setActiveConversation(conversationId);
      setIsNewConversation(false);
      updateUrl(`?id=${conversationId}`);
    },
    [conversations, setActiveConversation, setIsNewConversation, updateUrl]
  ); // Only recreate when these dependencies change

  // Effects
  // Ensure active conversation remains valid
  useEffect(() => {
    if (
      activeConversation &&
      !conversations.some((c) => c.id === activeConversation)
    ) {
      console.error(
        "Active conversation no longer exists:",
        activeConversation
      );

      // If current active conversation no longer exists
      if (conversations.length > 0) {
        // Select the first conversation
        const newActiveConversation = conversations[0].id;
        selectConversation(newActiveConversation);
      } else {
        // No conversations left
        selectConversation(null);
      }
    }
  }, [conversations, activeConversation, selectConversation]);

  // Save user's conversations to local storage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Set mobile view based on context:
  // - In MobileShell (isDesktop=false): Always use mobile layout
  // - In Desktop windows (isDesktop=true): Use window.innerWidth to allow dynamic resizing
  useEffect(() => {
    // MobileShell is only shown on small screens, so always use mobile layout
    if (!isDesktop) {
      setIsMobileView(true);
      setIsLayoutInitialized(true);
      return;
    }

    // Desktop mode: check window width for dynamic layout switching
    const handleResize = () => {
      const newIsMobileView = window.innerWidth < 768;
      if (isMobileView !== newIsMobileView) {
        setIsMobileView(newIsMobileView);

        // When transitioning from mobile to desktop, restore the last active conversation
        if (!newIsMobileView && !activeConversation && lastActiveConversation) {
          selectConversation(lastActiveConversation);
        }
      }
    };

    handleResize();
    setIsLayoutInitialized(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    isDesktop,
    isMobileView,
    activeConversation,
    lastActiveConversation,
    selectConversation,
  ]);

  // Get conversations from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const deletedInitialRaw = localStorage.getItem(DELETED_INITIAL_KEY);
    const urlParams = new URLSearchParams(window.location.search);
    const urlConversationId = urlParams.get("id");

    // Load set of deleted initial conversation IDs
    let deletedInitialIds: Set<string> = new Set();
    if (deletedInitialRaw) {
      try {
        const parsed = JSON.parse(deletedInitialRaw);
        if (Array.isArray(parsed)) {
          deletedInitialIds = new Set(parsed);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Start with initial conversations, excluding deleted ones
    let allConversations = initialConversations.filter(
      (conv) => !deletedInitialIds.has(conv.id)
    );

    if (saved) {
      try {
        // Load saved conversations
        const parsedConversations = JSON.parse(saved);

        if (!Array.isArray(parsedConversations)) {
          console.error("Invalid conversations format in localStorage");
          setConversations(allConversations);
          return;
        }

        // Create a map of initial conversation IDs for faster lookup
        const initialIds = new Set(initialConversations.map((conv) => conv.id));

        // Separate user-created and modified initial conversations
        const userConversations = [];
        const modifiedInitialConversations = new Map();

        for (const savedConv of parsedConversations) {
          if (initialIds.has(savedConv.id)) {
            modifiedInitialConversations.set(savedConv.id, savedConv);
          } else {
            userConversations.push(savedConv);
          }
        }

        // Update initial conversations with saved changes
        allConversations = allConversations.map((conv) =>
          modifiedInitialConversations.has(conv.id)
            ? modifiedInitialConversations.get(conv.id)
            : conv
        );

        // Add user-created conversations
        allConversations = [...allConversations, ...userConversations];
      } catch (error) {
        console.error("Error parsing saved conversations:", error);
      }
    }

    // Set conversations first
    setConversations(allConversations);

    // Handle conversation selection after setting conversations
    if (urlConversationId) {
      // Check if the URL conversation exists
      const conversationExists = allConversations.some(
        (c) => c.id === urlConversationId
      );
      if (conversationExists) {
        // If it exists, select it
        setActiveConversation(urlConversationId);
        return;
      }
    }

    // If mobile view, show the sidebar
    if (isMobileView) {
      updateUrl("/messages");
      setActiveConversation(null);
      return;
    }

    // Try restoring persisted conversation from sessionStorage (desktop/shell mode)
    const persistedId = loadMessagesConversation();
    if (persistedId && allConversations.some((c) => c.id === persistedId)) {
      setActiveConversation(persistedId);
      return;
    }

    // No URL ID, no persisted ID, and not mobile - select first conversation
    if (allConversations.length > 0) {
      setActiveConversation(allConversations[0].id);
    }
  }, [isMobileView, updateUrl]);

  // Update lastActiveConversation whenever activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      setLastActiveConversation(activeConversation);
      resetUnreadCount(activeConversation);
      saveMessagesConversation(activeConversation);
    }
  }, [activeConversation]);

  // Keep MessageQueue's internal state in sync with React's activeConversation state
  useEffect(() => {
    messageQueue.current.setActiveConversation(activeConversation);
  }, [activeConversation]);

  // Initialize message queue with proper state management
  const messageQueue = useRef<MessageQueue>(
    new MessageQueue({
      onMessageGenerated: (conversationId: string, message: Message) => {
        setConversations((prev) => {
          // Get the current active conversation from MessageQueue's internal state
          // This ensures we always have the latest value, not a stale closure
          const currentActiveConversation =
            messageQueue.current.getActiveConversation();

          const conversation = prev.find((c) => c.id === conversationId);
          if (!conversation) {
            console.error("Conversation not found:", conversationId);
            return prev;
          }

          // Determine if this message should increment unread count (show blue dot)
          // Note: hideAlerts and focusMode do NOT affect unread count - only sounds
          const shouldIncrementUnread =
            conversationId !== currentActiveConversation &&
            message.sender !== "me";

          // Play sound for messages in inactive conversations (unless muted)
          if (shouldIncrementUnread && !shouldMuteIncomingSound(conversation.hideAlerts, focusModeRef.current)) {
            soundEffects.playUnreadSound();
          }

          return prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  lastMessageTime: new Date().toISOString(),
                  unreadCount: shouldIncrementUnread
                    ? (conv.unreadCount || 0) + 1
                    : conv.unreadCount,
                }
              : conv
          );
        });
      },
      onMessageUpdated: (
        conversationId: string,
        messageId: string,
        updates: Partial<Message>
      ) => {
        setConversations((prev) => {
          const currentActiveConversation =
            messageQueue.current.getActiveConversation();

          // Note: hideAlerts and focusMode do NOT affect unread count - only sounds
          return prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  unreadCount:
                    conversationId === currentActiveConversation
                      ? conv.unreadCount
                      : (conv.unreadCount || 0) + 1,
                  messages: conv.messages.map((msg) => {
                    if (msg.id === messageId) {
                      // If we're updating reactions and the message already has reactions,
                      // merge them together instead of overwriting
                      const currentReactions = msg.reactions || [];
                      const newReactions = updates.reactions || [];

                      // Filter out any duplicate reactions (same type and sender)
                      const uniqueNewReactions = newReactions.filter(
                        (newReaction) =>
                          !currentReactions.some(
                            (currentReaction) =>
                              currentReaction.type === newReaction.type &&
                              currentReaction.sender === newReaction.sender
                          )
                      );
                      return {
                        ...msg,
                        ...updates,
                        reactions: [...currentReactions, ...uniqueNewReactions],
                      };
                    }
                    return msg;
                  }),
                }
              : conv
          );
        });
      },
      onTypingStatusChange: (
        conversationId: string | null,
        recipient: string | null
      ) => {
        if (!conversationId || !recipient) {
          setTypingStatus(null);
        } else {
          setTypingStatus({ conversationId, recipient });
        }
      },
      onError: (error: Error) => {
        console.error("Error generating message:", error);
        setTypingStatus(null);
      },
      shouldMuteIncomingSound: (hideAlerts: boolean | undefined) => {
        return shouldMuteIncomingSound(hideAlerts, focusModeRef.current);
      },
    })
  );

  // Cleanup message queue interval on unmount to prevent resource leaks
  useEffect(() => {
    const queue = messageQueue.current;
    return () => {
      queue.dispose();
    };
  }, []);

  // Method to reset unread count when conversation is selected
  const resetUnreadCount = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  };

  // Method to update conversation recipients
  const updateConversationRecipients = (
    conversationId: string,
    recipientNames: string[]
  ) => {
    setConversations((prev) => {
      const currentConversation = prev.find(
        (conv) => conv.id === conversationId
      );
      if (!currentConversation) return prev;

      // Find added and removed recipients
      const currentNames = currentConversation.recipients.map((r) => r.name);
      const added = recipientNames.filter(
        (name) => !currentNames.includes(name)
      );
      const removed = currentNames.filter(
        (name) => !recipientNames.includes(name)
      );

      // Create system messages (one for each change)
      const systemMessages: Message[] = [];

      // Format timestamp
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      removed.forEach((name) => {
        systemMessages.push({
          id: uuidv4(),
          content: `${timestamp}\n${name} was removed from the conversation`,
          sender: "system",
          timestamp,
        });
      });

      added.forEach((name) => {
        systemMessages.push({
          id: uuidv4(),
          content: `${timestamp}\n${name} was added to the conversation`,
          sender: "system",
          timestamp,
        });
      });

      // Find the recipient IDs for the given names
      const newRecipients = recipientNames.map((name) => {
        const existingRecipient = currentConversation.recipients.find(
          (r) => r.name === name
        );
        return (
          existingRecipient || {
            id: uuidv4(),
            name: name,
          }
        );
      });

      return prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              recipients: newRecipients,
              messages: [...conversation.messages, ...systemMessages],
            }
          : conversation
      );
    });
  };

  // Method to handle message draft changes
  const handleMessageDraftChange = (
    conversationId: string,
    message: string
  ) => {
    setMessageDrafts((prev) => ({
      ...prev,
      [conversationId]: message,
    }));
  };

  // Method to clear message draft after sending
  const clearMessageDraft = (conversationId: string) => {
    setMessageDrafts((prev) => {
      const newDrafts = { ...prev };
      delete newDrafts[conversationId];
      return newDrafts;
    });
  };

  // Method to create a new conversation with recipients
  const createNewConversation = (recipientNames: string[]) => {
    // Create recipients with IDs
    const recipients = recipientNames.map((name) => ({
      id: uuidv4(),
      name,
    }));

    // Create new conversation object
    const newConversation: Conversation = {
      id: uuidv4(),
      recipients,
      messages: [],
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      hideAlerts: false,
    };

    // Update state
    setConversations((prev) => {
      const updatedConversations = [newConversation, ...prev];
      setActiveConversation(newConversation.id);
      setIsNewConversation(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
      return updatedConversations;
    });

    updateUrl(`?id=${newConversation.id}`);
  };

  // Method to handle message sending
  const handleSendMessage = async (
    messageHtml: string,
    conversationId?: string
  ) => {
    const messageText = extractMessageContent(messageHtml);
    if (!messageText.trim()) return;

    // Create a new conversation if no conversation ID is provided or in new conversation mode
    if (!conversationId || isNewConversation) {
      // Validate recipients
      const recipients = recipientInput
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((name) => ({
          id: uuidv4(),
          name,
        }));

      // Don't send if no recipients are selected
      if (recipients.length === 0) return;

      // Create new conversation object
      const newConversation: Conversation = {
        id: uuidv4(),
        recipients,
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };

      // Create message object
      const message: Message = {
        id: uuidv4(),
        content: messageText,
        htmlContent: messageHtml,
        sender: "me",
        timestamp: new Date().toISOString(),
      };

      // Combine conversation with first message
      const conversationWithMessage = {
        ...newConversation,
        messages: [message],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };

      // Update state in a single, synchronous update
      setConversations((prev) => {
        const updatedConversations = [conversationWithMessage, ...prev];
        setActiveConversation(newConversation.id);
        setIsNewConversation(false);
        setRecipientInput("");
        clearMessageDraft("new");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
        return updatedConversations;
      });

      updateUrl(`?id=${newConversation.id}`);
      // Use enqueueUserMessage - the queue will handle group vs 1-on-1 logic
      messageQueue.current.enqueueUserMessage(conversationWithMessage);
      return;
    }

    // Handle existing conversation
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      console.error(
        `Conversation with ID ${conversationId} not found. Skipping message.`
      );
      return;
    }

    // Create message object
    const message: Message = {
      id: uuidv4(),
      content: messageText,
      htmlContent: messageHtml,
      sender: "me",
      timestamp: new Date().toISOString(),
    };

    // Update conversation with user message
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, message],
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    setConversations((prev) => {
      const updatedConversations = prev.map((c) =>
        c.id === conversationId ? updatedConversation : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
      return updatedConversations;
    });

    setActiveConversation(conversationId);
    setIsNewConversation(false);
    updateUrl(`?id=${conversationId}`);
    messageQueue.current.enqueueUserMessage(updatedConversation);
    clearMessageDraft(conversationId);
  };

  // Method to handle conversation deletion
  const handleDeleteConversation = (id: string) => {
    // Check if this is an initial conversation and track its deletion
    const initialIds = new Set(initialConversations.map((conv) => conv.id));
    if (initialIds.has(id)) {
      const deletedInitialRaw = localStorage.getItem(DELETED_INITIAL_KEY);
      let deletedInitialIds: string[] = [];
      if (deletedInitialRaw) {
        try {
          const parsed = JSON.parse(deletedInitialRaw);
          if (Array.isArray(parsed)) {
            deletedInitialIds = parsed;
          }
        } catch {
          // Ignore parse errors
        }
      }
      if (!deletedInitialIds.includes(id)) {
        deletedInitialIds.push(id);
        localStorage.setItem(DELETED_INITIAL_KEY, JSON.stringify(deletedInitialIds));
      }
    }

    setConversations((prevConversations) => {
      const newConversations = prevConversations.filter(
        (conv) => conv.id !== id
      );

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConversations));

      // If we're deleting the active conversation and there are conversations left
      if (id === activeConversation && newConversations.length > 0) {
        // Sort conversations the same way as in the sidebar
        const sortedConvos = [...prevConversations].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const timeA = a.lastMessageTime
            ? new Date(a.lastMessageTime).getTime()
            : 0;
          const timeB = b.lastMessageTime
            ? new Date(b.lastMessageTime).getTime()
            : 0;
          return timeB - timeA;
        });

        // Find the index of the deleted conversation in the sorted list
        const deletedIndex = sortedConvos.findIndex((conv) => conv.id === id);

        if (deletedIndex === sortedConvos.length - 1) {
          // If deleting the last conversation, go to the previous one
          selectConversation(sortedConvos[deletedIndex - 1].id);
        } else {
          // Otherwise go to the next conversation
          selectConversation(sortedConvos[deletedIndex + 1].id);
        }
      } else if (newConversations.length === 0) {
        // If no conversations left, clear the selection
        selectConversation(null);
      }

      return newConversations;
    });

  };

  // Method to handle conversation pin/unpin
  const handleUpdateConversation = (
    conversations: Conversation[],
    updateType?: "pin" | "mute"
  ) => {
    setConversations(conversations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    void updateType;
  };

  // Refs to hold current state for file menu actions
  const fileMenuStateRef = useRef({
    conversations,
    activeConversation,
    handleDeleteConversation,
    handleUpdateConversation,
  });

  // Keep refs up to date
  useEffect(() => {
    fileMenuStateRef.current = {
      conversations,
      activeConversation,
      handleDeleteConversation,
      handleUpdateConversation,
    };
  });

  // Register file menu actions for desktop menubar (only once on mount)
  useEffect(() => {
    if (!fileMenu) return;

    fileMenu.registerMessagesActions({
      onNewChat: () => {
        setIsNewConversation(true);
        setActiveConversation(null);
        updateUrl("/messages");
      },
      onPinChat: () => {
        const { activeConversation, conversations, handleUpdateConversation } = fileMenuStateRef.current;
        if (!activeConversation) return;
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === activeConversation) {
            return { ...conv, pinned: !conv.pinned };
          }
          return conv;
        });
        handleUpdateConversation(updatedConversations, "pin");
      },
      onHideAlerts: () => {
        const { activeConversation, conversations, handleUpdateConversation } = fileMenuStateRef.current;
        if (!activeConversation) return;
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === activeConversation) {
            return { ...conv, hideAlerts: !conv.hideAlerts };
          }
          return conv;
        });
        handleUpdateConversation(updatedConversations, "mute");
      },
      onDeleteChat: () => {
        const { activeConversation, handleDeleteConversation } = fileMenuStateRef.current;
        if (activeConversation) {
          handleDeleteConversation(activeConversation);
        }
      },
    });

    return () => {
      fileMenu.unregisterMessagesActions();
    };
  }, [fileMenu, updateUrl]);

  // Update file menu state when active conversation changes
  useEffect(() => {
    if (!fileMenu) return;
    const activeConv = conversations.find((c) => c.id === activeConversation);
    fileMenu.updateMessagesState({
      chatIsPinned: activeConv?.pinned ?? false,
      hideAlertsActive: activeConv?.hideAlerts ?? false,
    });
  }, [fileMenu, conversations, activeConversation]);

  // Method to handle reaction
  const handleReaction = useCallback(
    (messageId: string, reaction: Reaction) => {
      setConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          const messages = conversation.messages.map((message) => {
            if (message.id === messageId) {
              // Check if this exact reaction already exists
              const existingReaction = message.reactions?.find(
                (r) => r.sender === reaction.sender && r.type === reaction.type
              );

              if (existingReaction) {
                // If the same reaction exists, remove it
                return {
                  ...message,
                  reactions: message.reactions?.filter(
                    (r) => !(r.sender === reaction.sender && r.type === reaction.type)
                  ) || [],
                };
              } else {
                // Remove any other reaction from this sender and add the new one
                const otherReactions = message.reactions?.filter(
                  (r) => r.sender !== reaction.sender
                ) || [];
                return {
                  ...message,
                  reactions: [...otherReactions, reaction],
                };
              }
            }
            return message;
          });

          return {
            ...conversation,
            messages,
          };
        });
      });
    },
    []
  );

  // Method to update conversation name
  const handleUpdateConversationName = useCallback(
    (name: string) => {
      setConversations((prevConversations) => {
        return prevConversations.map((conv) =>
          conv.id === activeConversation ? { ...conv, name } : conv
        );
      });
    },
    [activeConversation]
  );

  // Method to handle hide alerts toggle
  const handleHideAlertsChange = useCallback(
    (hide: boolean) => {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === activeConversation ? { ...conv, hideAlerts: hide } : conv
        )
      );
    },
    [activeConversation]
  );

  // Handle sound toggle
  const handleSoundToggle = useCallback(() => {
    soundEffects.toggleSound();
  }, []);

  // Handle drag-to-move in the chat area header zone (desktop only)
  const handleChatAreaMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || !windowFocus) return;

    // Only handle in drag zone (top 52px)
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientY - rect.top > 52) return;

    // Don't handle drag in edit mode or on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('[data-recipient-pills]')) return;
    if (target.closest('button, input, a, [role="button"], select, textarea')) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let didDrag = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);
      if (!didDrag && (dx > 5 || dy > 5)) {
        didDrag = true;
        windowFocus.onDragStart(e);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (didDrag) {
        // Block the click event that would follow
        document.addEventListener('click', (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        }, { capture: true, once: true });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isDesktop, windowFocus]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  // Show empty background while initializing to prevent flash
  if (!isLayoutInitialized) {
    return <div className="h-full bg-background" />;
  }

  return (
    <div
      ref={containerRef}
      data-app="messages"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="flex h-full relative outline-none overflow-hidden"
    >
      <main className="h-full w-full bg-background flex flex-col overflow-hidden">
        <div className="flex-1 flex min-h-0">
          <div
            className={`h-full flex-shrink-0 overflow-hidden ${
              isMobileView
                ? activeConversation || isNewConversation
                  ? "hidden"
                  : "block w-full"
                : "block w-[320px] border-r dark:border-foreground/20"
            }`}
          >
            <Sidebar
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={(id) => {
                selectConversation(id);
              }}
              onDeleteConversation={handleDeleteConversation}
              onUpdateConversation={handleUpdateConversation}
              isMobileView={isMobileView}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              typingStatus={typingStatus}
              onScroll={setIsScrolled}
              onSoundToggle={handleSoundToggle}
            >
              <Nav
                onNewChat={() => {
                  setIsNewConversation(true);
                  selectConversation(null);
                  setRecipientInput("");
                  handleMessageDraftChange("new", "");
                }}
                isMobileView={isMobileView}
                isScrolled={isScrolled}
                isDesktop={isDesktop}
              />
            </Sidebar>
          </div>
          <div
            className={`flex-1 min-h-0 overflow-hidden relative ${
              isMobileView && !activeConversation && !isNewConversation
                ? "hidden"
                : "block"
            }`}
            onMouseDown={handleChatAreaMouseDown}
          >
            <ChatArea
              isNewChat={isNewConversation}
              activeConversation={
                activeConversation
                  ? conversations.find((c) => c.id === activeConversation)
                  : undefined
              }
              recipientInput={recipientInput}
              setRecipientInput={setRecipientInput}
              isMobileView={isMobileView}
              onBack={() => {
                setIsNewConversation(false);
                selectConversation(null);
              }}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
              typingStatus={typingStatus}
              conversationId={activeConversation || ""}
              onUpdateConversationRecipients={updateConversationRecipients}
              onCreateConversation={createNewConversation}
              onUpdateConversationName={handleUpdateConversationName}
              onHideAlertsChange={handleHideAlertsChange}
              messageDraft={
                isNewConversation
                  ? messageDrafts["new"] || ""
                  : messageDrafts[activeConversation || ""] || ""
              }
              onMessageDraftChange={handleMessageDraftChange}
              unreadCount={totalUnreadCount}
              isDesktop={isDesktop}
              focusModeActive={focusModeActive}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
