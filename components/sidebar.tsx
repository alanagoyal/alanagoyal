import React from "react";
import { Conversation } from "../types";
import { SearchBar } from "./search-bar";
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
}

export function Sidebar({ 
  children, 
  conversations, 
  activeConversation,
  onSelectConversation 
}: SidebarProps) {
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    
    try {
      const date = parseISO(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return 'Just now';
    }
  };

  return (
    <div className="w-80 flex flex-col border-r bg-muted">
      {children}
      <SearchBar value="" onChange={() => {}} />
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 text-left hover:bg-muted-foreground/10 ${
              activeConversation === conversation.id ? 'bg-muted-foreground/20' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {conversation.recipient.avatar ? (
                  <img 
                    src={conversation.recipient.avatar} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-medium">
                    {conversation.recipient.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium truncate">{conversation.recipient.name}</span>
                  {conversation.lastMessageTime && (
                    <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  )}
                </div>
                {conversation.messages.length > 0 && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.messages[conversation.messages.length - 1].content}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
