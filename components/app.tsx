import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState, useEffect } from "react";
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
    console.log(' [handleNewConversation] Starting stream connection');
    setIsStreaming(true);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: recipientList,
        topic: "Open Discussion",
        conversationHistory: [],
        isInitialMessage: true,
      }),
    });

    if (!response.ok) {
      console.error(' [handleNewConversation] Error:', response.statusText);
      setIsStreaming(false);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.error(' [handleNewConversation] No reader available');
      setIsStreaming(false);
      return;
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log(' [Stream] Stream completed');
              setIsStreaming(false);
            } else {
              try {
                const messageData = JSON.parse(data);
                console.log(' [Stream] Parsed message:', messageData);
                
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
                console.error(' [Stream] Error parsing message:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(' [Stream] Error reading stream:', error);
      setIsStreaming(false);
    } finally {
      reader.releaseLock();
    }
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
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </main>
  );
}
