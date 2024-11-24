import { Message, Conversation } from "../types";
import { useState, useEffect } from "react";
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
  inputRef?: React.RefObject<HTMLInputElement>;
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
  inputRef,
  isStreaming,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | undefined>(activeConversation);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    setConversation(activeConversation);
  }, [activeConversation]);

  // True if either initial conversation is streaming or we're waiting for a response
  const isCurrentlyStreaming = isStreaming || isResponding;

  const handleCreateChat = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && recipientInput.trim()) {
      onNewConversation(recipientInput.trim());
      setRecipientInput("");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || (!conversation && !isNewChat)) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

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

      // Create EventSource for streaming response
      const eventSource = new EventSource(
        `/api/stream-chat?${new URLSearchParams({
          prompt: JSON.stringify({
            recipients: updatedConversation.recipients.map(r => r.name),
            conversationHistory: updatedConversation.messages,
            topic: "Ongoing Discussion",
            isInitialMessage: false,
          }),
        })}`
      );

      eventSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSource.close();
          setIsResponding(false);
        } else {
          try {
            const messageData = JSON.parse(event.data);
            const responseMessage: Message = {
              id: Date.now().toString(),
              content: messageData.content,
              sender: messageData.sender,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            // Update both states using functional updates
            setConversation(current => {
              if (!current) return current;
              const updated = {
                ...current,
                messages: [...current.messages, responseMessage],
                lastMessageTime: new Date().toISOString(),
              };
              // Update parent state after local state is updated
              setTimeout(() => onUpdateConversations(updated), 0);
              return updated;
            });
          } catch (error) {
            console.error(' [handleSend] Error processing message:', error);
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error(' [handleSend] EventSource error:', error);
        eventSource.close();
        setIsResponding(false);
      };
    }

    setMessage("");
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
      <MessageList 
        messages={conversation?.messages || []} 
        isStreaming={isCurrentlyStreaming}
        conversation={conversation}
      />
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
        disabled={!conversation && !isNewChat}
        inputRef={inputRef}
      />
    </div>
  );
}
