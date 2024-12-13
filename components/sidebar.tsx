import { useEffect } from "react";
import { Conversation } from "../types";
import { SearchBar } from "./search-bar";
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { ConversationItem } from "./conversation-item";
import { Pin, Trash } from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (conversations: Conversation[]) => void;
  isMobileView?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typingStatus: { conversationId: string; recipient: string; } | null;
}

export function Sidebar({ 
  children, 
  conversations, 
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  isMobileView,
  searchTerm,
  onSearchChange,
  typingStatus
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
    // First sort by pinned status
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then sort by timestamp
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
    <div className={`${isMobileView ? 'w-full' : 'w-80'} h-dvh border-r dark:border-foreground/20 overflow-y-auto bg-muted`}>
      <div className="px-2">
        {children}
        <SearchBar value={searchTerm} onChange={onSearchChange} />
        <div className="space-y-2">
          {/* Pinned Conversations Grid */}
          {filteredConversations.some(conv => conv.pinned) && (
            <div className="p-2">
              <div 
                className={`flex flex-wrap gap-2 ${
                  filteredConversations.filter(c => c.pinned).length <= 2 
                    ? 'justify-center' 
                    : ''
                }`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  ...(filteredConversations.filter(c => c.pinned).length <= 2 && {
                    display: 'flex',
                    maxWidth: 'fit-content',
                    margin: '0 auto'
                  })
                }}
              >
                {filteredConversations
                  .filter(conv => conv.pinned)
                  .map((conversation) => (
                    <div 
                      key={conversation.id}
                      className="flex justify-center"
                    >
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => onSelectConversation(conversation.id)}
                            className={`w-20 aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                              activeConversation === conversation.id 
                                ? 'bg-blue-500 text-white' 
                                : ''
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
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
                            <span className="text-xs font-medium truncate w-full text-center">
                              {conversation.recipients[0].name}
                            </span>
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''}`}
                            onClick={() => {
                              const updatedConversations = conversations.map(conv => 
                                conv.id === conversation.id 
                                  ? { ...conv, pinned: false }
                                  : conv
                              );
                              onUpdateConversation(updatedConversations);
                            }}
                          >
                            <span>Unpin</span>
                            {isMobileView && <Pin className="h-4 w-4 ml-2" />}
                          </ContextMenuItem>
                          <ContextMenuItem
                            className={`focus:bg-blue-500 focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''} text-red-600`}
                            onClick={() => onDeleteConversation(conversation.id)}
                          >
                            <span>Delete</span>
                            {isMobileView && <Trash className="h-4 w-4 ml-2" />}
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Regular Conversation List */}
          {filteredConversations
            .filter(conv => !conv.pinned)
            .map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={{
                  ...conversation,
                  isTyping: typingStatus?.conversationId === conversation.id
                }}
                activeConversation={activeConversation}
                onSelectConversation={onSelectConversation}
                onDeleteConversation={onDeleteConversation}
                onUpdateConversation={onUpdateConversation}
                conversations={conversations}
                formatTime={formatTime}
                getInitials={getInitials}
                isMobileView={isMobileView}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
