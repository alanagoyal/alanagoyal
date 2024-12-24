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
import { useTheme } from "next-themes";

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (conversations: Conversation[]) => void;
  isMobileView: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  typingStatus: { conversationId: string; recipient: string; } | null;
  isCommandMenuOpen: boolean;
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
  typingStatus,
  isCommandMenuOpen
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
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
      // Don't handle navigation if command menu is open
      if (isCommandMenuOpen) return;

      // Check if the active element is within a chat header input or dropdown
      const activeElement = document.activeElement;
      const isChatHeaderActive = activeElement?.closest('[data-chat-header="true"]') !== null;
      
      if (isChatHeaderActive) {
        return;
      }

      // For letter shortcuts, check if we're in an input or editor
      if (['j', 'k', 'p', 'd', 't'].includes(e.key)) {
        if (
          document.activeElement?.tagName === 'INPUT' || 
          e.metaKey ||
          document.querySelector('.ProseMirror')?.contains(document.activeElement)
        ) {
          return;
        }
      }

      // Theme toggle shortcut
      if (e.key === 't') {
        e.preventDefault();
        setTheme(theme === "light" ? "dark" : "light");
        return;
      }

      // Focus search on forward slash
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && 
          document.activeElement?.tagName !== 'INPUT' && 
          !document.activeElement?.closest('.ProseMirror')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Navigation shortcuts - only navigate through filtered conversations
      if ((e.key === 'ArrowDown' || e.key === 'j') && filteredConversations.length > 0) {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(
          conv => conv.id === activeConversation
        );
        
        // If current conversation is not in filtered results, select the first one
        if (currentIndex === -1) {
          onSelectConversation(filteredConversations[0].id);
          return;
        }
        
        const nextIndex = (currentIndex + 1) % filteredConversations.length;
        onSelectConversation(filteredConversations[nextIndex].id);
      } 
      else if ((e.key === 'ArrowUp' || e.key === 'k') && filteredConversations.length > 0) {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(
          conv => conv.id === activeConversation
        );
        
        // If current conversation is not in filtered results, select the last one
        if (currentIndex === -1) {
          onSelectConversation(filteredConversations[filteredConversations.length - 1].id);
          return;
        }
        
        const nextIndex = currentIndex - 1 < 0 
          ? filteredConversations.length - 1 
          : currentIndex - 1;
        onSelectConversation(filteredConversations[nextIndex].id);
      }
      // Action shortcuts
      else if (e.key === 'p') {
        e.preventDefault();
        if (!activeConversation) return;
        
        const updatedConversations = conversations.map(conv => {
          if (conv.id === activeConversation) {
            return { ...conv, pinned: !conv.pinned };
          }
          return conv;
        });
        onUpdateConversation(updatedConversations);
      }
      else if (e.key === 'd') {
        e.preventDefault();
        if (!activeConversation) return;
        onDeleteConversation(activeConversation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeConversation, filteredConversations, conversations, onSelectConversation, onUpdateConversation, onDeleteConversation, isCommandMenuOpen, theme]);

  return (
    <div className={`${isMobileView ? 'w-full' : 'w-80'} h-dvh border-r dark:border-foreground/20 overflow-y-auto bg-muted`}>
      <div className="pl-2">
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
                                ? 'bg-[#0A7CFF] text-white' 
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
                            className={`focus:bg-[#0A7CFF] focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''}`}
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
                            className={`focus:bg-[#0A7CFF] focus:text-white ${isMobileView ? 'flex items-center justify-between' : ''} text-red-600`}
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
            .map((conversation, index, array) => {
              const isActive = conversation.id === activeConversation;
              const nextConversation = array[index + 1];
              const isNextActive = nextConversation?.id === activeConversation;
              
              return (
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
                  showDivider={!isActive && !isNextActive && index !== array.length - 1}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}
