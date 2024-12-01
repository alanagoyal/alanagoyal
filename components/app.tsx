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
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            messages: [...c.messages, message],
            lastMessageTime: new Date().toISOString(),
            // Increment unread count if this is not the active conversation
            unreadCount: c.id === activeConversation ? 0 : (c.unreadCount || 0) + 1
          };
        })
      );
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

  // Get conversations from local storage
  useEffect(() => {
    const saved = localStorage.getItem("dialogueConversations");
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("id");

    let allConversations = [];

    // Start with initial conversations if there are no saved ones
    if (!saved) {
      allConversations = [...initialConversations];
    } else {
      try {
        // Load saved conversations
        allConversations = JSON.parse(saved);

        // Check if we need to add any initial conversations
        // Only add if they don't exist in saved conversations
        const savedIds = new Set(allConversations.map((c: Conversation) => c.id));
        const missingInitialConvos = initialConversations.filter((c) => !savedIds.has(c.id));

        if (missingInitialConvos.length > 0) {
          allConversations = [...allConversations, ...missingInitialConvos];
        }
      } catch (e) {
        console.error("Error parsing saved conversations:", e);
        allConversations = [...initialConversations];
      }
    }

    // Sort all conversations by last message time, most recent first
    allConversations.sort((a: Conversation, b: Conversation) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setConversations(allConversations);

    // Find the most recent conversation
    const mostRecentConvo = allConversations.length > 0
      ? allConversations.reduce((latest: Conversation, current: Conversation) => {
          const latestTime = new Date(latest.lastMessageTime).getTime();
          const currentTime = new Date(current.lastMessageTime).getTime();
          return currentTime > latestTime ? current : latest;
        }, allConversations[0])
      : null;

    // If there's a valid conversation ID in the URL and it exists, use that
    if (
      conversationId &&
      allConversations.some((c: Conversation) => c.id === conversationId)
    ) {
      setActiveConversation(conversationId);
    } else if (mostRecentConvo) {
      setActiveConversation(mostRecentConvo.id);
      window.history.replaceState({}, "", `?id=${mostRecentConvo.id}`);
    }
  }, []);

  // Save user's conversations to local storage
  useEffect(() => {
    localStorage.setItem(
      "dialogueConversations",
      JSON.stringify(conversations)
    );
  }, [conversations]);

  // Set active conversation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("id");
    if (
      conversationId &&
      conversations.length > 0 &&
      conversations.some((c) => c.id === conversationId)
    ) {
      setActiveConversation(conversationId);
    }
  }, [conversations.length]);

  // Update URL to active conversation
  useEffect(() => {
    if (activeConversation) {
      window.history.pushState({}, "", `?id=${activeConversation}`);
    } else {
      window.history.pushState({}, "", window.location.pathname);
    }
  }, [activeConversation]);

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

  // Effect to reset unread count when conversation becomes active
  useEffect(() => {
    if (activeConversation) {
      setConversations(prev => 
        prev.map(c => 
          c.id === activeConversation 
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    }
  }, [activeConversation]);

  // Handle sending a message
  const handleSendMessage = (message: string, conversationId?: string) => {
    if (!conversationId) {
      // Handle new conversation
      const newConversation: Conversation = {
        id: uuidv4(),
        recipients: recipientInput
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r.length > 0)
          .map((name) => ({
            id: uuidv4(),
            name,
          })),
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };

      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const conversationWithMessage = {
        ...newConversation,
        messages: [userMessage],
      };

      setConversations((prev) => [conversationWithMessage, ...prev]);
      setActiveConversation(newConversation.id);
      setIsNewConversation(false);
      window.history.pushState({}, "", `?id=${newConversation.id}`);

      // Queue first AI message
      messageQueue.current.enqueueAIMessage(conversationWithMessage, true);
      return;
    }

    // Handle existing conversation
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Add user message
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
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updatedConversation : c))
    );

    // Queue user message response
    messageQueue.current.enqueueUserMessage(updatedConversation);
  };

  // Don't render until layout is initialized
  if (!isLayoutInitialized) {
    return null;
  }

  return (
    <main className="h-screen w-screen bg-background flex flex-col">
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
            onSelectConversation={setActiveConversation}
            isMobileView={isMobileView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          >
            <Nav
              onNewChat={() => {
                setIsNewConversation(true);
                setRecipientInput("");
                setActiveConversation(null);
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
            onBack={() => {
              setActiveConversation(null);
              setIsNewConversation(false);
            }}
            onSendMessage={handleSendMessage}
            typingStatus={typingStatus}
            conversationId={activeConversation}
          />
        </div>
      </div>
    </main>
  );
}
