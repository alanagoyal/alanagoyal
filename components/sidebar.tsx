import React, { useEffect } from "react";
import { Conversation } from "../types";
import { SearchBar } from "./search-bar";
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  isMobileView?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Sidebar({ 
  children, 
  conversations, 
  activeConversation,
  onSelectConversation,
  isMobileView,
  searchTerm,
  onSearchChange
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

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA; // Most recent first
  });

  const filteredConversations = sortedConversations.filter(conversation => {
    if (!searchTerm) return true;
    
    // Search in non-system messages content only
    const hasMatchInMessages = conversation.messages
      .filter(message => message.sender !== 'system')
      .some(message =>
        message.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Search in recipient names
    const hasMatchInNames = conversation.recipients.some(recipient =>
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return hasMatchInMessages || hasMatchInNames;
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the active element is within a chat header input or dropdown
      const activeElement = document.activeElement;
      const isChatHeaderActive = activeElement?.closest('[data-chat-header="true"]') !== null;
      
      if (isChatHeaderActive) {
        return;
      }

      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return;
      }

      e.preventDefault();
      
      const currentIndex = filteredConversations.findIndex(
        conv => conv.id === activeConversation
      );
      
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      if (e.key === 'ArrowUp') {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = filteredConversations.length - 1;
        }
      } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= filteredConversations.length) {
          nextIndex = 0;
        }
      }
      
      if (nextIndex !== currentIndex) {
        onSelectConversation(filteredConversations[nextIndex].id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeConversation, filteredConversations, onSelectConversation]);

  return (
    <div className={`${isMobileView ? 'w-full' : 'w-80 border-r dark:border-foreground/20'} h-full flex flex-col bg-muted`}>
      {children}
      <SearchBar value={searchTerm} onChange={onSearchChange} />
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation, index) => (
          <React.Fragment key={conversation.id}>
            <button
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full p-4 pl-6 text-left relative ${
                activeConversation === conversation.id 
                  ? 'bg-blue-500 text-white rounded-sm' 
                  : ''
              }`}
            >
              <div className="flex items-center">
                {conversation.unreadCount > 0 && (
                  <div className="absolute left-2 w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                )}
                <div className="flex items-start gap-2 w-full min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {conversation.recipients[0].avatar ? (
                      <img 
                        src={conversation.recipients[0].avatar} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-medium">
                        {getInitials(conversation.recipients[0].name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium truncate max-w-[70%]">
                        {conversation.recipients.map(r => r.name).join(', ')}
                      </span>
                      {conversation.lastMessageTime && (
                        <span className={`text-xs ml-2 flex-shrink-0 ${
                          activeConversation === conversation.id 
                            ? 'text-white/80' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {conversation.messages.length > 0 && (
                      <p className={`text-xs truncate ${
                        activeConversation === conversation.id 
                          ? 'text-white/80' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.messages
                          .filter(message => message.sender !== 'system')
                          .slice(-1)[0]?.content || ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </button>
            {index < filteredConversations.length - 1 && (
              <div className="px-[56px] pr-2">
                <div className="h-[1px] bg-foreground/10 dark:bg-foreground/20" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
