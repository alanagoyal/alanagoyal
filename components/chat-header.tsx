import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Conversation } from "../types";
import { useState, useRef, useEffect } from "react";
import { techPersonalities } from "../data/tech-personalities";

interface ChatHeaderProps {
  isNewChat: boolean;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  onBack?: () => void;
  isMobileView?: boolean;
  activeConversation?: Conversation;
  onUpdateRecipients?: (recipientNames: string[]) => void;
}

export function ChatHeader({
  isNewChat,
  recipientInput,
  setRecipientInput,
  onBack,
  isMobileView,
  activeConversation,
  onUpdateRecipients,
}: ChatHeaderProps) {

  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPeople = techPersonalities.filter((person) =>
    person.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was on a close button
      const isCloseButton = (event.target as Element).closest('button[aria-label^="Remove"]');
      
      if (isCloseButton) {
        return;
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
        if (isEditMode) {
          setIsEditMode(false);
          const recipientNames = recipientInput.split(',').filter(r => r.trim());
          onUpdateRecipients?.(recipientNames);
          setRecipientInput('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditMode, recipientInput, onUpdateRecipients]);

  // Reset selected index when search value changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchValue]);

  // Add effect to handle focus when searchValue changes
  useEffect(() => {
    if (searchValue === '') {
      inputRef.current?.focus();
    }
  }, [searchValue]);

  useEffect(() => {
    if (!isNewChat && !isEditMode) {
      setRecipientInput('');
    }
  }, [isNewChat, isEditMode]);

  const handlePersonSelect = (person: typeof techPersonalities[0]) => {
    const newValue = recipientInput 
      ? recipientInput.split(',').filter(r => r.trim()).concat(person.name).join(',')
      : person.name;
    setRecipientInput(newValue + ',');
    setSearchValue('');
    setShowResults(false);
    setSelectedIndex(-1);
  };

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
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleHeaderClick = () => {
    if (!isNewChat && !isEditMode) {
      setIsEditMode(true);
      const recipients = activeConversation?.recipients.map(r => r.name).join(',') || '';
      setRecipientInput(recipients + ',');
    }
  };

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
              className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-sm bg-blue-100/50 dark:bg-[#15406B]/50 text-gray-900 dark:text-gray-100"
            >
              {trimmedRecipient}
              <button
                onClick={() => {
                  const newRecipients = recipientInput
                    .split(',')
                    .filter(r => r.trim())
                    .filter((_, i) => i !== index)
                    .join(',');
                  setRecipientInput(newRecipients + ',');
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
    <div 
      className="h-auto flex items-center justify-between p-4 sm:px-4 sm:py-2 border-b dark:border-foreground/20 bg-muted cursor-pointer"
      onClick={() => {
        if (!isNewChat && !isEditMode) {
          setIsEditMode(true);
          const recipients = activeConversation?.recipients.map(r => r.name).join(',') || '';
          setRecipientInput(recipients + ',');
        }
      }}
      data-chat-header="true"
    >
      <div className="flex items-center gap-2 flex-1">
        {isMobileView && (
          <button
            onClick={onBack}
            className="rounded-sm"
            aria-label="Back to conversations"
          >
            <Icons.back />
          </button>
        )}
        {isNewChat || isEditMode ? (
          <div className="flex-1">
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
                    placeholder="Type to find recipients..."
                    className="flex-1 bg-transparent outline-none text-base sm:text-sm min-w-[120px] w-full"
                    autoFocus
                    data-chat-header="true"
                  />
                  {showResults && searchValue && (
                    <div 
                      className="absolute left-0 min-w-[250px] w-max top-full mt-1 bg-background rounded-lg shadow-lg max-h-[300px] overflow-auto z-50"
                      data-chat-header-dropdown="true"
                    >
                      {filteredPeople.length > 0 ? (
                        filteredPeople.map((person, index) => (
                          <div
                            key={person.name}
                            className={`px-4 py-2 ${
                              selectedIndex === index 
                                ? "bg-[#0A7CFF]" 
                                : ""
                            }`}
                            onClick={() => handlePersonSelect(person)}
                            onMouseEnter={() => setSelectedIndex(index)}
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
              {activeConversation?.recipients.map(r => r.name).join(', ')}
            </span>
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}
