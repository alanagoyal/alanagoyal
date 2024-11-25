import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect, useRef } from "react";
import { Nav } from "./nav";
import { Conversation, Message } from "../types";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'dialogueConversations';

export default function App() {
  const [isNewChat, setIsNewChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [typingParticipant, setTypingParticipant] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id');
    if (conversationId && conversations.some(c => c.id === conversationId)) {
      setActiveConversation(conversationId);
    }
  }, [conversations]);

  useEffect(() => {
    if (activeConversation) {
      window.history.pushState({}, '', `?id=${activeConversation}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [activeConversation]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    setIsLayoutInitialized(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewConversation = async (input: string) => {
    console.log(' [NEW CONVERSATION] Starting new conversation with input:', input);
    
    const recipientList = input.split(',').map(r => r.trim()).filter(r => r.length > 0);
    if (recipientList.length === 0) return;

    console.log(' [NEW CONVERSATION] Recipient list:', recipientList);

    const now = new Date();    
    const newConversation: Conversation = {
      id: uuidv4(),
      recipients: recipientList.map(name => ({
        id: uuidv4(),
        name,
        avatar: undefined
      })),
      messages: [],
      lastMessageTime: now.toISOString(),
    };
    
    if (!isValidDate(newConversation.lastMessageTime)) {
      console.error(' [NEW CONVERSATION] Invalid date created:', newConversation.lastMessageTime);
      return;
    }
    
    console.log(' [NEW CONVERSATION] Created conversation:', {
      id: newConversation.id,
      recipients: newConversation.recipients.map(r => r.name)
    });

    // Create a promise to track when the state is updated
    const stateUpdatePromise = new Promise<void>(resolve => {
      setConversations(prevConversations => {
        const newState = [newConversation, ...prevConversations];
        setTimeout(resolve, 0);
        return newState;
      });
    });

    setActiveConversation(newConversation.id);
    setIsNewChat(false);
    setRecipientInput("");

    await stateUpdatePromise;
    console.log(' [NEW CONVERSATION] State updated, starting first message generation');
    
    try {
      await generateNextMessage(newConversation);
    } catch (error) {
      console.error(' [NEW CONVERSATION] Error generating first message:', error);
    }
  };

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const generateNextMessage = async (conversation: Conversation, userMessage?: Message) => {
    console.log(' [generateNextMessage] Starting for conversation:', conversation.id);
    
    let currentMessages = [...conversation.messages];
    setIsStreaming(true);
    
    if (userMessage) {
      currentMessages = [...currentMessages, userMessage];
      setConversations(prevConversations => {
        return prevConversations.map(c => 
          c.id === conversation.id 
            ? {
                ...c,
                messages: currentMessages,
                lastMessageTime: new Date().toISOString(),
              }
            : c
        );
      });
    }

    // Abort any ongoing streams
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    try {
      console.log(' [generateNextMessage] Sending request with messages:', currentMessages);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: conversation.recipients,
          messages: currentMessages,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      console.log(' [generateNextMessage] Received response:', data);
      
      const nextParticipant = data.sender;
      
      // Show typing indicator
      setTypingParticipant(nextParticipant);
      
      // Wait for 3 seconds to simulate typing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add the message
      const newMessage: Message = {
        id: Date.now().toString(),
        content: data.content,
        sender: nextParticipant,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      console.log(' [generateNextMessage] Adding new message:', newMessage);

      // Update conversations with the new message
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(c => {
          if (c.id !== conversation.id) return c;
          
          const updatedMessages = [...c.messages, newMessage];
          return {
            ...c,
            messages: updatedMessages,
            lastMessageTime: new Date().toISOString(),
          };
        });
        return updatedConversations;
      });
      
      setTypingParticipant(null);
      setIsStreaming(false);
      
      // Wait for state to update before continuing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the latest conversation state and continue
      const currentConversation = conversations.find(c => c.id === conversation.id);
      if (currentConversation) {
        setTimeout(() => {
          generateNextMessage({
            ...currentConversation,
            messages: [...currentConversation.messages, newMessage]
          });
        }, 3000);
      }
      
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error generating message:', error instanceof Error ? error.message : 'Unknown error');
      setIsStreaming(false);
      setTypingParticipant(null);
    }
  };

  const handleSendMessage = async (message: string, conversationId: string) => {
    if (!message.trim()) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    generateNextMessage(conversation, newMessage);
  };

  if (!isLayoutInitialized) {
    return null;
  }

  return (
    <main className="h-screen w-screen bg-background flex flex-col">
      <div className="flex-1 flex h-full">
        <div className={`h-full ${isMobileView ? 'w-full' : ''} ${(isMobileView && (activeConversation || isNewChat)) ? 'hidden' : 'block'}`}>
          <Sidebar 
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
            isMobileView={isMobileView}
          >
            <Nav onNewChat={() => {
              setIsNewChat(true);
              setRecipientInput("");
              setActiveConversation(null);
            }} />
          </Sidebar>
        </div>
        <div className={`flex-1 h-full ${isMobileView ? 'w-full' : ''} ${(isMobileView && !activeConversation && !isNewChat) ? 'hidden' : 'block'}`}>
          <ChatArea 
            isNewChat={isNewChat}
            onNewConversation={handleNewConversation}
            activeConversation={conversations.find(c => c.id === activeConversation)}
            recipientInput={recipientInput}
            setRecipientInput={setRecipientInput}
            isMobileView={isMobileView}
            onBack={() => setActiveConversation(null)}
            isStreaming={isStreaming}
            typingParticipant={typingParticipant}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </main>
  );
}
