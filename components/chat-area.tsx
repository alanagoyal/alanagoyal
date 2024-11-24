import { Message, Conversation } from "../types";
import { useState, useEffect, useRef } from "react";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatAreaProps {
  isNewChat: boolean;
  onNewConversation: (recipientInput: string) => void;
  activeConversation?: Conversation;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  onUpdateConversations: (conversation: Conversation) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  isStreaming?: boolean;
}

export function ChatArea({
  isNewChat,
  onNewConversation,
  activeConversation,
  recipientInput,
  setRecipientInput,
  onUpdateConversations,
  isMobileView,
  onBack,
  isStreaming,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | undefined>(activeConversation);
  const [isResponding, setIsResponding] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConversation(activeConversation);
    // Focus input when conversation becomes active
    if (activeConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [activeConversation]);

  // Cleanup function to abort any ongoing streams when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && recipientInput.trim()) {
      onNewConversation(recipientInput.trim());
      setRecipientInput("");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || (!conversation && !isNewChat)) return;

    // Abort any ongoing streams before sending a new message
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsResponding(false);
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

    // Clear the input
    setMessage("");

    if (conversation) {
      // Update conversation with user's message
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        lastMessageTime: new Date().toISOString(),
      };
      
      setConversation(updatedConversation);
      onUpdateConversations(updatedConversation);

      // Set streaming state to true before creating EventSource
      setIsResponding(true);

      // Create new AbortController for this stream
      abortControllerRef.current = new AbortController();

      // Create EventSource for streaming response
      const response = await fetch('/api/stream-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: updatedConversation.recipients.map(r => r.name),
          conversationHistory: updatedConversation.messages,
          topic: "Ongoing Discussion",
          isInitialMessage: false,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        console.error(' [handleSend] Error:', response.statusText);
        setIsResponding(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error(' [handleSend] No reader available');
        setIsResponding(false);
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            setIsResponding(false);
            // Focus input after stream completes
            if (messageInputRef.current) {
              messageInputRef.current.focus();
            }
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsResponding(false);
                // Focus input after stream completes
                if (messageInputRef.current) {
                  messageInputRef.current.focus();
                }
              } else {
                try {
                  const messageData = JSON.parse(data);
                  const responseMessage: Message = {
                    id: Date.now().toString(),
                    content: messageData.content,
                    sender: messageData.sender,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  };

                  setConversation(current => {
                    if (!current) return current;
                    const updated = {
                      ...current,
                      messages: [...current.messages, responseMessage],
                      lastMessageTime: new Date().toISOString(),
                    };
                    setTimeout(() => onUpdateConversations(updated), 0);
                    return updated;
                  });
                } catch (error) {
                  console.error(' [handleSend] Error processing message:', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(' [handleSend] Error reading stream:', error);
        setIsResponding(false);
      } finally {
        reader.releaseLock();
      }
    }

  };

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        isNewChat={isNewChat}
        recipientInput={recipientInput}
        setRecipientInput={setRecipientInput}
        handleCreateChat={handleCreateChat}
        isMobileView={isMobileView}
        onBack={onBack}
        activeConversation={conversation}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList 
          messages={conversation?.messages || []} 
          conversation={conversation}
          isStreaming={isStreaming && isResponding}
        />
        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          inputRef={messageInputRef}
          disabled={!conversation && !isNewChat} // Only disable if there's no conversation and it's not a new chat
        />
      </div>
    </div>
  );
}
