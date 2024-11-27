import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect } from "react";
import { Nav } from "./nav";
import { Conversation, Message } from "../types";
import { v4 as uuidv4 } from "uuid";
import { initialConversations } from "../data/initial-conversations";

export default function App() {
  // State
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [recipientInput, setRecipientInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [typingStatus, setTypingStatus] = useState<{
    conversationId: string;
    recipient: string;
  } | null>(null);

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

  // Function to start a new conversation
  const handleNewConversation = async (input: string) => {
    // Get list of recipients
    const recipientList = input
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    if (recipientList.length === 0) return;

    // Create new conversation object
    const now = new Date();
    const newConversation: Conversation = {
      id: uuidv4(),
      recipients: recipientList.map((name) => ({
        id: uuidv4(),
        name,
      })),
      messages: [],
      lastMessageTime: now.toISOString(),
    };

    try {
      // Add new conversation to conversations state
      await new Promise<void>((resolve) => {
        setConversations((prevConversations) => {
          const newState = [newConversation, ...prevConversations];
          resolve();
          return newState;
        });
      });

      // Set active conversation
      setActiveConversation(newConversation.id);
      setIsNewConversation(false);

      // Generate first message using the new conversation object directly
      await generateNextMessage(newConversation, true);
    } catch (error) {
      console.error("Error sending first message:", error);
    }
  };

  const generateNextMessage = async (
    conversation: Conversation,
    isFirstMessage: boolean
  ) => {
    try {
      // Count consecutive AI messages from the end
      let consecutiveAiMessages = 0;
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        if (conversation.messages[i].sender !== "me") {
          consecutiveAiMessages++;
        } else {
          break;
        }
      }

      // Check if we've reached the message limit
      if (consecutiveAiMessages >= 4) {
        return;
      }

      // Determine if this should be the wrap-up message
      const shouldWrapUp = consecutiveAiMessages === 3;

      // Make API request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: conversation.recipients,
          messages: conversation.messages,
          shouldWrapUp,
          isFirstMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      setTypingStatus({
        conversationId: conversation.id,
        recipient: data.sender,
      });
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const newMessage: Message = {
        id: uuidv4(),
        content: data.content,
        sender: data.sender,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Update conversation state
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversation.id) return c;
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessageTime: new Date().toISOString(),
          };
        })
      );

      setTypingStatus(null);

      // Continue conversation if not at limit
      if (!shouldWrapUp) {
        const updatedConversation = {
          ...conversation,
          messages: [...conversation.messages, newMessage],
        };
        await new Promise((resolve) => setTimeout(resolve, 500));
        await generateNextMessage(updatedConversation, false);
      }
    } catch (error) {
      console.error("Error:", error);
      setTypingStatus(null);
    }
  };

  // Function to handle user message
  const handleSendMessage = async (content: string) => {
    // Validate input
    if (!activeConversation || !content.trim()) {
      return;
    }

    // Get conversation
    const conversation = conversations.find((c) => c.id === activeConversation);
    if (!conversation) {
      console.error("Conversation not found:", activeConversation);
      return;
    }

    // Create new message
    const newMessage: Message = {
      id: uuidv4(),
      content: content.trim(),
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Add the user's message and update lastMessageTime
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessageTime: new Date().toISOString(),
    };

    // Update state with user's message
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation ? updatedConversation : c))
    );

    // Then start a new generation chain with the updated conversation
    await generateNextMessage(updatedConversation, false);
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
            onNewConversation={handleNewConversation}
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
