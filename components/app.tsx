import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect, useRef } from "react";
import { Nav } from "./nav";
import { Conversation } from "../types";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'dialogueConversations';

export default function App() {
  const [isNewChat, setIsNewChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
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

  const handleNewConversation = (recipient: string) => {
    const now = new Date();    
    const newConversation: Conversation = {
      id: uuidv4(),
      recipient: {
        id: uuidv4(),
        name: recipient,
        avatar: undefined
      },
      messages: [],
      lastMessageTime: now.toISOString(),
    };
    
    if (!isValidDate(newConversation.lastMessageTime)) {
      console.error('Invalid date created:', newConversation.lastMessageTime);
      console.error('Date validation result:', new Date(newConversation.lastMessageTime));
      return;
    }
    
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
    setIsNewChat(false);
    setRecipient("");
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
              setRecipient("");
              setActiveConversation(null);
            }} />
          </Sidebar>
        </div>
        <div className={`flex-1 h-full ${isMobileView ? 'w-full' : ''} ${(isMobileView && !activeConversation && !isNewChat) ? 'hidden' : 'block'}`}>
          <ChatArea 
            isNewChat={isNewChat} 
            setIsNewChat={(value) => {
              setIsNewChat(value);
            }}
            onNewConversation={handleNewConversation}
            activeConversation={conversations.find(c => c.id === activeConversation)}
            recipient={recipient}
            setRecipient={(value) => {
              setRecipient(value);
            }}
            onUpdateConversations={(updatedConversation) => {
              setConversations(conversations.map(c => 
                c.id === updatedConversation.id ? updatedConversation : c
              ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
            }}
            isMobileView={isMobileView}
            onBack={() => {
              setActiveConversation(null);
              setIsNewChat(false);
            }}
            inputRef={inputRef}
          />
        </div>
      </div>
    </main>
  );
}
