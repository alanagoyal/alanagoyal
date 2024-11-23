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
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  useEffect(() => {
    if (activeConversation) {
      window.history.pushState({}, '', `?id=${activeConversation}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (!isNewChat && activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNewChat, activeConversation]);

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
    console.log(' [handleNewConversation] Starting with input:', input);
    
    const recipientList = input.split(',').map(r => r.trim()).filter(r => r.length > 0);
    if (recipientList.length === 0) return;

    console.log(' [handleNewConversation] Recipient list:', recipientList);

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
      console.error(' [handleNewConversation] Invalid date created:', newConversation.lastMessageTime);
      console.error(' [handleNewConversation] Date validation result:', new Date(newConversation.lastMessageTime));
      return;
    }
    
    console.log(' [handleNewConversation] Created new conversation:', newConversation);
    
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
    setIsNewChat(false);
    setRecipientInput("");

    // Generate initial conversation
    console.log(' [handleNewConversation] Starting EventSource connection');
    const eventSource = new EventSource(
      `/api/stream-chat?${new URLSearchParams({
        prompt: JSON.stringify({
          recipients: recipientList,
          topic: "Open Discussion",
          conversationHistory: [],
          isInitialMessage: true,
        }),
      })}`
    );

    let aiResponse = "";
    let currentSender = "";
    eventSource.onmessage = (event) => {
      console.log(' [EventSource] Message received:', event.data);
      
      if (event.data === "[DONE]") {
        console.log(' [EventSource] Stream completed');
        eventSource.close();
      } else {
        try {
          const messageData = JSON.parse(event.data);
          console.log(' [EventSource] Parsed message:', messageData);
          
          const newMessage: Message = {
            id: uuidv4(),
            content: messageData.content,
            sender: messageData.sender,
            timestamp: new Date().toISOString()
          };
          
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === newConversation.id 
                ? { 
                    ...conv, 
                    messages: [...conv.messages, newMessage]
                  }
                : conv
            )
          );
        } catch (error) {
          console.error(' [EventSource] Error parsing message:', error);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error(' [EventSource] Error:', error);
      eventSource.close();
    };
  };

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
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
            setIsNewChat={setIsNewChat}
            onNewConversation={handleNewConversation}
            activeConversation={conversations.find(c => c.id === activeConversation)}
            recipientInput={recipientInput}
            setRecipientInput={setRecipientInput}
            onUpdateConversations={(updatedConversation) => {
              setConversations(conversations.map(c => 
                c.id === updatedConversation.id ? updatedConversation : c
              ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
            }}
            isMobileView={isMobileView}
            onBack={() => setActiveConversation(null)}
            inputRef={inputRef}
          />
        </div>
      </div>
    </main>
  );
}
