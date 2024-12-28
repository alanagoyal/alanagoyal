import { Icons } from "./icons";
import { Conversation } from "../types";
import { useState, useRef, useEffect, useCallback } from "react";
import { techPersonalities } from "../data/tech-personalities";
import { useToast } from "@/hooks/use-toast"

interface ChatHeaderProps {
  isNewChat: boolean;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  onBack?: () => void;
  isMobileView?: boolean;
  activeConversation?: Conversation;
  onUpdateRecipients?: (recipientNames: string[]) => void;
  onCreateConversation?: (recipientNames: string[]) => void;
  unreadCount?: number;
}

export function ChatHeader({
  isNewChat,
  recipientInput,
  setRecipientInput,
  onBack,
  isMobileView,
  activeConversation,
  onUpdateRecipients,
  onCreateConversation,
  unreadCount,
}: ChatHeaderProps) {
  console.log('Unread count in ChatHeader:', unreadCount);
  const { toast } = useToast();

  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCompactNewChat, setShowCompactNewChat] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update the conversation recipients
  const updateRecipients = useCallback(() => {
    if (isNewChat || isEditMode) {
      const recipientNames = recipientInput.split(',').filter(r => r.trim());
      
      // Handle editing mode validation
      if (isEditMode && recipientNames.length === 0) {
        toast({
          description: "You need at least one recipient"
        });
        return;
      }
      
      // Only show toast for new conversations on desktop
      if (isNewChat && !isMobileView && recipientNames.length === 0) {
        toast({
          description: "Please add at least one recipient"
        });
        return;
      }

      // Only proceed with updates if we have recipients or we're going back on mobile
      if (isEditMode && recipientNames.length > 0) {
        setIsEditMode(false);
        onUpdateRecipients?.(recipientNames);
      } else if (isNewChat && (!isMobileView || recipientNames.length > 0)) {
        onCreateConversation?.(recipientNames);
      }
      setSearchValue('');
    }
  }, [isNewChat, isEditMode, recipientInput, onUpdateRecipients, onCreateConversation, toast, isMobileView]);

  // Effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was on a close button or its children
      const isCloseButton = (event.target as Element).closest('button[aria-label^="Remove"]');
      
      // Don't do anything if it's a close button click
      if (isCloseButton) {
        event.stopPropagation();
        return;
      }

      // Only handle click outside if we clicked outside the search area
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
        updateRecipients();
      }
    };

    const focusInput = () => {
      if ((isNewChat || isEditMode) && inputRef.current) {
        inputRef.current.focus();
        // Ensure the input is visible
        setShowResults(true);
      }
    };

    const manageInputState = () => {
      if (isNewChat || isEditMode) {
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        setShowResults(false);
        setRecipientInput('');
        setSearchValue('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    focusInput();
    manageInputState();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNewChat, isEditMode, recipientInput, onUpdateRecipients, onCreateConversation, searchValue, setRecipientInput, updateRecipients]);

  // Filter the tech personalities based on the search value
  const filteredPeople = techPersonalities.filter((person) =>
    person.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Handle person selection
  const handlePersonSelect = (person: typeof techPersonalities[0]) => {
    const newValue = recipientInput 
      ? recipientInput.split(',').filter(r => r.trim()).concat(person.name).join(',')
      : person.name;
    setRecipientInput(newValue + ',');
    setSearchValue('');
    setShowResults(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent sidebar navigation when dropdown is active
    e.stopPropagation();

    if (e.key === 'Backspace' && !searchValue) {
      e.preventDefault();
      const recipients = recipientInput.split(',').filter(r => r.trim());
      if (recipients.length > 0) {
        const newRecipients = recipients.slice(0, -1).join(',');
        setRecipientInput(newRecipients + (newRecipients ? ',' : ''));
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowResults(false);
      setSelectedIndex(-1);
      updateRecipients();
      return;
    }

    if (!showResults || !searchValue) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPeople.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPeople.length) {
          handlePersonSelect(filteredPeople[selectedIndex]);
        }
        break;
    }
  };

  // Handle header click
  const handleHeaderClick = () => {
    if (!isNewChat && !isEditMode) {
      setIsEditMode(true);
      const recipients = activeConversation?.recipients.map(r => r.name).join(',') || '';
      setRecipientInput(recipients + ',');
    } else if (isNewChat && showCompactNewChat) {
      setShowCompactNewChat(false);
    }
  };

  // Render the recipient pills
  const renderRecipients = () => {
    const recipients = recipientInput.split(',');
    const completeRecipients = recipients.slice(0, -1);
    
    return (
      <>
        {completeRecipients.map((recipient, index) => {
          const trimmedRecipient = recipient.trim();
          if (!trimmedRecipient) return null;
          
          return (
            <span 
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-base sm:text-sm bg-blue-100/50 dark:bg-[#15406B]/50 text-gray-900 dark:text-gray-100"
            >
              {trimmedRecipient}
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent default button behavior
                  e.stopPropagation(); // Stop event from bubbling
                  const newRecipients = recipientInput
                    .split(',')
                    .filter(r => r.trim())
                    .filter((_, i) => i !== index)
                    .join(',');
                  setRecipientInput(newRecipients + ',');
                }}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur on the input
                }}
                className="ml-1.5 hover:text-red-600 dark:hover:text-red-400"
                aria-label={`Remove ${trimmedRecipient}`}
              >
                <Icons.close className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </>
    );
  };

  return (
    <div className="sticky top-0 z-10 flex flex-col w-full bg-background/80 backdrop-blur-md border-b">
      <div 
        className="h-16 flex items-center justify-between p-4"
        onClick={(e) => {
          // Ignore clicks from recipient pills or dropdown
          if (
            !(e.target as Element).closest('[data-chat-header-dropdown="true"]') &&
            !(e.target as Element).closest('button[aria-label^="Remove"]') &&
            !(e.target as Element).closest('.bg-blue-100\\/50')
          ) {
            handleHeaderClick();
          }
        }}
        data-chat-header="true"
      >
        <div className="flex items-center gap-2 flex-1">
          {isMobileView && (
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditMode) {
                    // Check for empty recipients in edit mode
                    const recipientNames = recipientInput.split(',').filter(r => r.trim());
                    if (recipientNames.length === 0) {
                      toast({
                        description: "You need at least one recipient"
                      });
                      return;
                    }
                  }
                  // For new chat, just clear and go back
                  if (isNewChat) {
                    setRecipientInput('');
                    setSearchValue('');
                    setShowResults(false);
                  }
                  onBack?.();
                }}
                className="rounded-sm relative"
                aria-label="Back to conversations"
              >
                <Icons.back />
                {unreadCount ? (
                  <div className="absolute -top-2 -right-2 bg-[#0A7CFF] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    {unreadCount}
                  </div>
                ) : null}
              </button>
            </div>
          )}
          {(isNewChat && !showCompactNewChat) || isEditMode ? (
            <div className="flex-1" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-base sm:text-sm font-medium text-muted-foreground">
                  To:
                </span>
                <div className="flex flex-wrap gap-1 flex-1 items-center">
                  {renderRecipients()}
                  <div ref={searchRef} className="relative flex-1" data-chat-header="true">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setShowResults(true);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={(e) => {
                        // Don't handle blur if clicking remove button or dropdown
                        const isRemoveButton = (e.relatedTarget as Element)?.closest('button[aria-label^="Remove"]');
                        if (!isRemoveButton && !e.relatedTarget?.closest('[data-chat-header-dropdown="true"]')) {
                          setShowResults(false);
                          setSelectedIndex(-1);
                          updateRecipients();
                        }
                      }}
                      placeholder="Type to find recipients..."
                      className="flex-1 bg-transparent outline-none text-base sm:text-sm min-w-[120px] w-full"
                      autoFocus
                      data-chat-header="true"
                    />
                    {showResults && searchValue && (
                      <div 
                        className="absolute left-0 min-w-[250px] w-max top-full mt-1 bg-background rounded-lg shadow-lg max-h-[300px] overflow-auto z-50"
                        data-chat-header-dropdown="true"
                        tabIndex={-1}
                      >
                        {filteredPeople.length > 0 ? (
                          filteredPeople.map((person, index) => (
                            <div
                              key={person.name}
                              className={`px-4 py-2 cursor-pointer ${
                                selectedIndex === index 
                                  ? "bg-[#0A7CFF]" 
                                  : ""
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handlePersonSelect(person);
                              }}
                              onMouseEnter={() => setSelectedIndex(index)}
                              tabIndex={0}
                            >
                              <div className="flex flex-col">
                                <span className={`text-sm ${selectedIndex === index ? "text-white" : "text-[#0A7CFF]"}`}>{person.name}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2" 
              onClick={handleHeaderClick}
              data-chat-header="true"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {isNewChat ? recipientInput.split(',').filter(r => r.trim()).join(', ') : activeConversation?.recipients.map(r => r.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
