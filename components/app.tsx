import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect, useRef } from "react";
import { Nav } from "./nav";
import { Conversation, Message } from "../types";
import { v4 as uuidv4 } from "uuid";
import { initialConversations } from "../data/initial-conversations";
import { MessageQueue } from "../lib/message-queue";

export default function App() {
  // State
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [typingStatus, setTypingStatus] = useState<{
    conversationId: string;
    recipient: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize message queue
  const messageQueue = useRef<MessageQueue>(new MessageQueue({
    onMessageGenerated: (conversationId: string, message: Message) => {
      handleIncomingMessage(conversationId, message);
    },
    onTypingStatusChange: (conversationId: string | null, recipient: string | null) => {
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
  }));

  // Method to handle incoming AI message and manage unread state
  const handleIncomingMessage = (
    conversationId: string, 
    message: Message, 
    isAIMessage: boolean = false
  ) => {
    console.log("📬 Incoming message:", {
      conversationId, 
      isAIMessage,
      activeConversation,
      sender: message.sender
    });

    // Update conversations with new message
    setConversations(prev => 
      prev.map(conversation => {
        if (conversation.id !== conversationId) return conversation;

        // Determine if the message should increment unread count
        const shouldIncrementUnread = 
          conversationId !== activeConversation && 
          message.sender !== "me" &&
          // Ensure we don't increment for messages already in the conversation
          !conversation.messages.some(m => m.id === message.id);

        return {
          ...conversation,
          messages: conversation.messages.some(m => m.id === message.id)
            ? conversation.messages
            : [...conversation.messages, message],
          lastMessageTime: new Date().toISOString(),
          unreadCount: shouldIncrementUnread 
            ? (conversation.unreadCount || 0) + 1 
            : conversation.unreadCount
        };
      })
    );
  };

  // Method to reset unread count when conversation is selected
  const resetUnreadCount = (conversationId: string) => {
    console.log("🔔 Resetting unread count:", conversationId);

    setConversations(prev => 
      prev.map(conversation => 
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  };

  // Get conversations from local storage
  useEffect(() => {
    const saved = localStorage.getItem("dialogueConversations");
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("id");

    console.log("🔍 Initializing conversations:", {
      savedConversations: saved,
      urlConversationId: conversationId
    });

    let allConversations: Conversation[] = [];

    // Start with initial conversations if there are no saved ones
    if (!saved) {
      allConversations = [...initialConversations];
      console.log("📦 No saved conversations, using initial conversations");
    } else {
      try {
        // Load saved conversations
        const parsedConversations = JSON.parse(saved);
        
        // Validate parsed conversations
        if (!Array.isArray(parsedConversations)) {
          console.error("❌ Saved conversations is not an array:", parsedConversations);
          allConversations = [...initialConversations];
        } else {
          allConversations = parsedConversations;

          // Check if we need to add any initial conversations
          const savedIds = new Set(allConversations.map((c: Conversation) => c.id));
          const missingInitialConvos = initialConversations.filter((c) => !savedIds.has(c.id));

          if (missingInitialConvos.length > 0) {
            allConversations = [...allConversations, ...missingInitialConvos];
            console.log("➕ Added missing initial conversations:", missingInitialConvos.length);
          }
        }
      } catch (e) {
        console.error("❌ Error parsing saved conversations:", e);
        allConversations = [...initialConversations];
      }
    }

    // Sort all conversations by last message time, most recent first
    allConversations.sort((a: Conversation, b: Conversation) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    console.log("📋 Total conversations loaded:", allConversations.length);
    console.log("📝 Conversation details:", allConversations.map(c => ({
      id: c.id,
      recipients: c.recipients.map(r => r.name),
      messageCount: c.messages.length
    })));

    // Determine the initial active conversation
    const determineActiveConversation = () => {
      console.log("🔍 Determining active conversation:");
      
      // Priority 1: URL parameter
      if (
        conversationId &&
        allConversations.some((c: Conversation) => c.id === conversationId)
      ) {
        console.log("🔗 Using conversation from URL:", conversationId);
        return conversationId;
      }

      // Priority 2: Most recent conversation
      const mostRecentConvo = allConversations.length > 0
        ? allConversations[0]  // Since conversations are sorted, first is most recent
        : null;

      if (mostRecentConvo) {
        console.log("🕒 Using most recent conversation:", mostRecentConvo.id);
        window.history.replaceState({}, "", `?id=${mostRecentConvo.id}`);
        return mostRecentConvo.id;
      }

      // Priority 3: First conversation if exists
      const fallbackConvo = allConversations.length > 0 ? allConversations[0].id : null;
      console.log("🚦 Fallback conversation selection:", fallbackConvo);
      return fallbackConvo;
    };

    const initialActiveConversation = determineActiveConversation();
    
    // Ensure we always set an active conversation if conversations exist
    if (initialActiveConversation || allConversations.length > 0) {
      const conversationToActivate = initialActiveConversation || allConversations[0].id;
      
      console.log("🎯 Setting initial active conversation:", {
        conversationId: conversationToActivate,
        conversationExists: !!allConversations.find(c => c.id === conversationToActivate)
      });

      setConversations(allConversations);
      setActiveConversation(conversationToActivate);
    } else {
      console.warn("⚠️ No conversations available to set as active");
      setConversations([]);
      setActiveConversation(null);
    }
  }, []);

  // Robust conversation selection method
  const selectConversation = (conversationId: string | null) => {
    console.log("🔀 Selecting conversation:", conversationId, {
      currentActiveConversation: activeConversation,
      isMobileView: isMobileView
    });
    
    // In mobile view, if no conversation is selected, return to sidebar
    if (isMobileView && conversationId === null) {
      console.log("📱 Mobile view: Returning to sidebar");
      
      // Reset unread count for the previous active conversation
      if (activeConversation) {
        console.log("🔔 Resetting unread count for previous conversation:", activeConversation);
        setConversations(prev => 
          prev.map(conversation => 
            conversation.id === activeConversation
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      }

      setActiveConversation(null);
      setIsNewConversation(false);
      window.history.pushState({}, "", "/");
      return;
    }

    // If there's a currently active conversation, mark it as read
    if (activeConversation) {
      console.log("📖 Marking previous conversation as read:", activeConversation);
      
      // Reset unread count for the previously active conversation
      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === activeConversation
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
    }

    // If no conversation ID is provided, handle new conversation state
    if (conversationId === null) {
      console.log("🆕 Preparing for new conversation");
      setActiveConversation(null);
      setIsNewConversation(true);
      window.history.pushState({}, "", "/");
      return;
    }

    // Find the conversation in the list
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );

    // Log detailed selection information
    console.log("🕵️ Conversation selection details:", {
      requestedId: conversationId,
      conversationFound: !!selectedConversation,
      totalConversations: conversations.length,
      conversationIds: conversations.map(c => c.id)
    });

    // If conversation is not found, handle gracefully
    if (!selectedConversation) {
      console.warn(`❌ Conversation with ID ${conversationId} not found`);
      
      // Fallback to most recent conversation if available
      if (conversations.length > 0) {
        const fallbackConversation = conversations[0];
        console.log("🚧 Falling back to most recent conversation:", fallbackConversation.id);
        
        // Reset unread count for fallback conversation
        resetUnreadCount(fallbackConversation.id);
        
        setActiveConversation(fallbackConversation.id);
        window.history.pushState({}, "", `?id=${fallbackConversation.id}`);
        return;
      }

      // If no conversations exist, reset to new conversation state
      console.warn("⚠️ No conversations available. Resetting to new conversation state.");
      setActiveConversation(null);
      setIsNewConversation(false);
      window.history.pushState({}, "", "/");
      return;
    }

    // Reset unread count for selected conversation
    resetUnreadCount(conversationId);

    // Successfully select the conversation
    setActiveConversation(conversationId);
    setIsNewConversation(false);
    window.history.pushState({}, "", `?id=${conversationId}`);
  };

  // Ensure active conversation remains valid
  useEffect(() => {
    if (activeConversation && !conversations.some(c => c.id === activeConversation)) {
      console.warn("⚠️ Active conversation no longer exists:", activeConversation);
      
      // If current active conversation no longer exists
      if (conversations.length > 0) {
        // Select the first conversation
        const newActiveConversation = conversations[0].id;
        console.log("🔄 Switching to first available conversation:", newActiveConversation);
        selectConversation(newActiveConversation);
      } else {
        // No conversations left
        console.log("🚫 No conversations available, setting active conversation to null");
        selectConversation(null);
      }
    }
  }, [conversations, activeConversation]);

  // Save user's conversations to local storage
  useEffect(() => {
    localStorage.setItem(
      "dialogueConversations",
      JSON.stringify(conversations)
    );
  }, [conversations]);

  // Set mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    setIsLayoutInitialized(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle sending a message
  const handleSendMessage = (message: string, conversationId?: string) => {
    console.log("📨 Sending message:", {
      message,
      conversationId,
      isNewConversation: isNewConversation
    });

    // Validate input
    if (!message.trim()) return;

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

      if (recipients.length === 0) return;

      // Create new conversation object
      const newConversation: Conversation = {
        id: uuidv4(),
        recipients,
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };

      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Combine conversation with first message
      const conversationWithMessage = {
        ...newConversation,
        messages: [userMessage],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0  // Explicitly set unread count to 0 for new conversation
      };

      // Update state in a single, synchronous update
      setConversations(prev => {
        const updatedConversations = [conversationWithMessage, ...prev];
        
        console.log("🆕 Created new conversation:", {
          conversationId: newConversation.id,
          recipients: recipients.map(r => r.name)
        });

        // Immediately after state update, set active conversation and reset new conversation state
        setActiveConversation(newConversation.id);
        setIsNewConversation(false);

        // Persist updated conversations to local storage
        localStorage.setItem("dialogueConversations", JSON.stringify(updatedConversations));

        return updatedConversations;
      });

      // Update URL to reflect new conversation
      window.history.pushState({}, "", `?id=${newConversation.id}`);

      // Queue first AI message
      messageQueue.current.enqueueAIMessage(conversationWithMessage, true);
      return;
    }

    // Handle existing conversation
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      console.warn(`❌ Conversation with ID ${conversationId} not found. Skipping message.`);
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Update conversation with user message
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0  // Explicitly set unread count to 0 when sending a message
    };

    // Update conversations and ensure current conversation is active
    setConversations((prev) => {
      const updatedConversations = prev.map((c) => 
        c.id === conversationId ? updatedConversation : c
      );

      // Persist updated conversations to local storage
      localStorage.setItem("dialogueConversations", JSON.stringify(updatedConversations));

      return updatedConversations;
    });

    // Ensure the current conversation is selected
    console.log("✅ Sending message in existing conversation:", {
      conversationId,
      messageContent: message
    });

    setActiveConversation(conversationId);
    setIsNewConversation(false);
    window.history.pushState({}, "", `?id=${conversationId}`);

    // Queue user message response
    messageQueue.current.enqueueUserMessage(updatedConversation);
  };

  // Don't render until layout is initialized
  if (!isLayoutInitialized) {
    return null;
  }

  return (
    <main className="h-dvh w-full bg-background flex flex-col">
      <div className="flex-1 flex h-full">
        <div
          className={`h-full ${isMobileView ? "w-full" : ""} ${
            isMobileView && (activeConversation || isNewConversation)
              ? "hidden"
              : "block"
          }`}
        >
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={selectConversation}
            isMobileView={isMobileView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          >
            <Nav
              onNewChat={() => {
                setIsNewConversation(true);
                setRecipientInput("");
                selectConversation(null);
              }}
            />
          </Sidebar>
        </div>
        <div
          className={`flex-1 h-full ${isMobileView ? "w-full" : ""} ${
            isMobileView && !activeConversation && !isNewConversation
              ? "hidden"
              : "block"
          }`}
        >
          <ChatArea
            isNewChat={isNewConversation}
            activeConversation={conversations.find(
              (c) => c.id === activeConversation
            )}
            recipientInput={recipientInput}
            setRecipientInput={setRecipientInput}
            isMobileView={isMobileView}
            onBack={() => selectConversation(null)}
            onSendMessage={handleSendMessage}
            typingStatus={typingStatus}
            conversationId={activeConversation}
          />
        </div>
      </div>
    </main>
  );
}
