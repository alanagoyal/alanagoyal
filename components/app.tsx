import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect } from "react";
import { Nav } from "./nav";
import { Conversation } from "../types";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'dialogueConversations';

export default function App() {
  const [isNewChat, setIsNewChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");

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

  const handleNewConversation = (recipient: string) => {
    const newConversation: Conversation = {
      id: uuidv4(),
      recipient,
      messages: [],
      lastMessageTime: new Date().toISOString(),
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
    setIsNewChat(false);
    setRecipient("");
  };

  return (
    <main className="h-screen w-screen bg-background flex flex-col">
      <div className="flex-1 flex">
        <Sidebar 
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
        >
          <Nav onNewChat={() => {
            setIsNewChat(true);
            setRecipient("");
            setActiveConversation(null);
          }} />
        </Sidebar>
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
        />
      </div>
    </main>
  );
}
