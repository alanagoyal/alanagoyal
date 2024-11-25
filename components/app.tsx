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
  const [typingParticipant, setTypingParticipant] = useState<string | null>(null);
  const [aiMessageCount, setAiMessageCount] = useState<number>(0);

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
    const recipientList = input.split(',').map(r => r.trim()).filter(r => r.length > 0);
    if (recipientList.length === 0) return;

    console.log(' [NEW CONVERSATION] Recipient list:', recipientList);

    const now = new Date();    
    const newConversation: Conversation = {
      id: uuidv4(),
      recipients: recipientList.map(name => ({
        id: uuidv4(),
        name,
      })),
      messages: [],
      lastMessageTime: now.toISOString(),
    };

    console.log(' [NEW CONVERSATION] Created conversation:', {
      id: newConversation.id,
      recipients: newConversation.recipients
    });

    try {
      // Update state and wait for it to complete
      await new Promise<void>(resolve => {
        setConversations(prevConversations => {
          const newState = [newConversation, ...prevConversations];
          console.log(' [NEW CONVERSATION] Updated conversation state:', {
            conversationId: newConversation.id,
            totalConversations: newState.length
          });
          resolve();
          return newState;
        });
      });

      // Set active conversation
      console.log(' [NEW CONVERSATION] Setting active conversation:', newConversation.id);
      setActiveConversation(newConversation.id);
      setIsNewChat(false);

      // Generate first message using the new conversation object directly
      console.log(' [NEW CONVERSATION] Starting first message generation');
      await generateNextMessage(newConversation);
    } catch (error) {
      console.error(' [NEW CONVERSATION] Error:', error);
    }
  };

  const generateNextMessage = async (conversation: Conversation, lastMessage?: Message) => {
    console.log(' [generateNextMessage] Starting with:', {
      conversationId: conversation.id,
      lastMessage,
      currentAiCount: aiMessageCount
    });

    // Use the conversation object passed in instead of finding it in state
    let currentMessages = [...conversation.messages];
    
    // Add the last message if it's not already included
    if (lastMessage && !currentMessages.some(m => m.id === lastMessage.id)) {
      console.log(' [generateNextMessage] Adding last message to current messages:', lastMessage);
      currentMessages = [...currentMessages, lastMessage];
    }

    try {
      // Get current AI messages in the conversation
      const aiMessages = currentMessages.filter(m => m.sender !== 'me').length;
      
      // If this is after a user message, only count AI messages after their last message
      const lastUserMessageIndex = currentMessages.map(m => m.sender).lastIndexOf('me');
      const messageCountToConsider = lastUserMessageIndex >= 0 
        ? currentMessages.slice(lastUserMessageIndex).filter(m => m.sender !== 'me').length
        : aiMessages;
      
      console.log(' [generateNextMessage] Message counts:', {
        totalAiMessages: aiMessages,
        afterLastUserMessage: messageCountToConsider
      });

      // Check if we've reached the limit
      if (messageCountToConsider >= 6) {
        console.log(' [generateNextMessage] Reached message limit, adding wrap-up message');
        const wrapUpMessage: Message = {
          id: uuidv4(),
          sender: conversation.recipients[1].name,
          content: "I need to wrap up our conversation now. Feel free to start a new message if you'd like to continue the discussion!",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        };

        setConversations(prev => prev.map(c => 
          c.id === conversation.id 
            ? { ...c, messages: [...c.messages, wrapUpMessage] }
            : c
        ));
        return;
      }

      console.log(' [generateNextMessage] Sending API request with:', {
        recipientCount: conversation.recipients.length,
        messageCount: currentMessages.length
      });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: conversation.recipients,
          messages: currentMessages,
        })
      });

      if (!response.ok) {
        console.error(' [generateNextMessage] API request failed:', response.status);
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      console.log(' [generateNextMessage] API response:', data);
      
      // Show typing indicator for the next participant
      console.log(' [generateNextMessage] Setting typing participant:', data.sender);
      setTypingParticipant(data.sender);
      
      // Wait for 3 seconds to simulate typing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create the new message
      const newMessage: Message = {
        id: uuidv4(),
        content: data.content,
        sender: data.sender,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      };

      // Update conversations with the new message
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== conversation.id) return c;
          
          const updatedMessages = [...c.messages];
          if (lastMessage && !updatedMessages.some(m => m.id === lastMessage.id)) {
            updatedMessages.push(lastMessage);
          }
          updatedMessages.push(newMessage);
          
          return {
            ...c,
            messages: updatedMessages,
            lastMessageTime: new Date().toISOString(),
          };
        });
        return updated;
      });
      
      // Clear typing indicator
      setTypingParticipant(null);

      // Get the updated conversation with the new message
      const updatedConversation = {
        ...conversation,
        messages: [...currentMessages, newMessage]
      };

      // Calculate next AI message count
      const nextAiMessages = messageCountToConsider + 1;
      console.log(' [generateNextMessage] Next AI message count:', nextAiMessages);

      // Only continue if we haven't reached the limit
      if (nextAiMessages < 6) {
        // Use await to prevent parallel chains
        await new Promise(resolve => setTimeout(resolve, 1000));
        await generateNextMessage(updatedConversation);
      } else {
        // Add wrap-up message when we reach the limit
        const wrapUpMessage: Message = {
          id: uuidv4(),
          sender: conversation.recipients[1].name,
          content: "I need to wrap up our conversation now. Feel free to start a new message if you'd like to continue the discussion!",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        };

        setConversations(prev => prev.map(c => 
          c.id === conversation.id 
            ? { ...c, messages: [...c.messages, wrapUpMessage] }
            : c
        ));
      }
    } catch (error) {
      console.error(' [generateNextMessage] Error:', error);
      setTypingParticipant(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    console.log(' [handleSendMessage] Starting with:', {
      activeConversation,
      content,
      contentLength: content.length
    });

    if (!activeConversation || !content.trim()) {
      console.log(' [handleSendMessage] Invalid input, returning');
      return;
    }

    // Reset AI message count when user sends a message
    console.log(' [handleSendMessage] Resetting AI message count');
    setAiMessageCount(0);

    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) {
      console.error(' [handleSendMessage] Conversation not found:', activeConversation);
      return;
    }

    const newMessage: Message = {
      id: uuidv4(),
      content: content.trim(),
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    };

    console.log(' [handleSendMessage] Created user message:', newMessage);

    // Add user's message to the conversation
    setConversations(prev => {
      const updated = prev.map(c => 
        c.id === activeConversation 
          ? { ...c, messages: [...c.messages, newMessage] }
          : c
      );
      console.log(' [handleSendMessage] Updated conversation state:', {
        conversationId: activeConversation,
        messageCount: updated.find(c => c.id === activeConversation)?.messages.length
      });
      return updated;
    });

    // Generate next AI message
    console.log(' [handleSendMessage] Starting next message generation');
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
              console.log(' [NEW CHAT] Starting new chat');
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
            typingParticipant={typingParticipant}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </main>
  );
}
