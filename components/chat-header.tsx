import { Icons } from "./icons";
import { Conversation } from "../types";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { techPersonalities } from "../data/tech-personalities";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserContacts, addUserContact } from "@/lib/contacts";
import { ContactDrawer } from "./contact-drawer";

// Helper to check if we can add more recipients
const hasReachedMaxRecipients = (recipients: string) => {
  const currentRecipients = recipients.split(",").filter(r => r.trim());
  return currentRecipients.length >= 4;
};

// Types
interface ChatHeaderProps {
  isNewChat: boolean;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  onBack?: () => void;
  isMobileView?: boolean;
  activeConversation?: Conversation;
  onUpdateRecipients?: (recipientNames: string[]) => void;
  onCreateConversation?: (recipientNames: string[]) => void;
  onUpdateConversationName?: (name: string) => void;
  unreadCount?: number;
  showCompactNewChat?: boolean;
  setShowCompactNewChat?: (show: boolean) => void;
}

interface RecipientPillProps {
  recipient: string;
  index: number;
  onRemove: (index: number) => void;
  isMobileView?: boolean;
}

interface RecipientSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  showResults: boolean;
  selectedIndex: number;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePersonSelect: (person: (typeof techPersonalities)[0]) => void;
  handleAddContact: () => Promise<void>;
  setSelectedIndex: (index: number) => void;
  setShowResults: (show: boolean) => void;
  updateRecipients: () => void;
  isMobileView?: boolean;
  recipientInput: string;
  isValidating: boolean;
}

// Sub-components
function RecipientPill({
  recipient,
  index,
  onRemove,
  isMobileView,
}: RecipientPillProps) {
  const trimmedRecipient = recipient.trim();
  if (!trimmedRecipient) return null;

  return (
    <div className={cn("sm:inline", isMobileView && "w-full")}>
      <span className="inline-flex items-center px-2 py-1 rounded-lg text-base sm:text-sm bg-blue-100/50 dark:bg-[#15406B]/50 text-gray-900 dark:text-gray-100">
        {trimmedRecipient}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(index);
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="ml-1.5 hover:text-red-600 dark:hover:text-red-400"
          aria-label={`Remove ${trimmedRecipient}`}
        >
          <Icons.close className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}

function RecipientSearch({
  searchValue,
  setSearchValue,
  showResults,
  selectedIndex,
  handleKeyDown,
  handlePersonSelect,
  handleAddContact,
  setSelectedIndex,
  setShowResults,
  updateRecipients,
  isMobileView,
  recipientInput,
  isValidating,
}: RecipientSearchProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  // Focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keep selected item in view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Filter people based on search value
  const displayPeople = useMemo(() => {
    const currentRecipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const combined = [...techPersonalities];
    const userContacts = getUserContacts();
    
    // Add user contacts, avoiding duplicates
    userContacts.forEach(contact => {
      if (!combined.some(p => p.name.toLowerCase() === contact.name.toLowerCase())) {
        combined.push(contact);
      }
    });

    // Filter out current recipients and by search value
    const filtered = combined.filter(person => {
      const matchesSearch = !searchValue || person.name.toLowerCase().includes(searchValue.toLowerCase());
      const notSelected = !currentRecipients.includes(person.name);
      return matchesSearch && notSelected;
    });

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchValue, recipientInput]);

  return (
    <div
      ref={searchRef}
      className={cn("relative", isMobileView ? "w-full" : "flex-1")}
      data-chat-header="true"
    >
      <div className="flex items-center w-full">
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
            const isRemoveButton = (e.relatedTarget as Element)?.closest(
              'button[aria-label^="Remove"]'
            );
            const isDropdown = e.relatedTarget?.closest('[data-chat-header-dropdown="true"]');
            
            if (!isRemoveButton && !isDropdown) {
              updateRecipients();
            }
          }}
          onFocus={() => {
            if (!hasReachedMaxRecipients(recipientInput)) {
              setShowResults(true);
            }
          }}
          placeholder="Type to add recipients..."
          className="flex-1 bg-transparent outline-none text-base sm:text-sm min-w-[120px] w-full"
          data-chat-header="true"
        />
        <button
          onClick={handleAddContact}
          className={cn(
            "flex items-center justify-center w-8 h-8",
            searchValue && displayPeople.length === 0
              ? "text-muted-foreground hover:text-foreground"
              : "invisible"
          )}
        >
          {isValidating ? (
            <Icons.spinner className="h-5 w-5 animate-spin" />
          ) : (
            <Icons.plus className="h-5 w-5 text-[#404040] dark:text-white" />
          )}
        </button>
      </div>

      {showResults && displayPeople.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 min-w-[250px] w-max top-full mt-1 bg-background rounded-lg shadow-lg z-50"
          data-chat-header-dropdown="true"
          tabIndex={-1}
        >
          <ScrollArea
            style={{ height: `${Math.min(displayPeople.length * 36 + 16, 376)}px` }}
            className="w-full rounded-md border border-input bg-background p-2"
            isMobile={isMobileView}
            bottomMargin="0"
          >
            <div className="p-0">
              {displayPeople.map((person, index) => (
                <div
                  key={person.name}
                  ref={selectedIndex === index ? selectedItemRef : null}
                  className={`p-2 cursor-pointer rounded-md ${
                    selectedIndex === index ? "bg-[#0A7CFF] hover:bg-[#0A7CFF]" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handlePersonSelect(person);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  tabIndex={0}
                >
                  <div className="flex flex-col">
                    <span
                      className={`text-sm ${
                        selectedIndex === index ? "text-white" : "text-[#0A7CFF]"
                      }`}
                    >
                      {person.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function MobileAvatars({
  recipients,
}: {
  recipients: Array<{ name: string; avatar?: string }>;
}) {
  const getOffset = (index: number, total: number) => {
    if (total === 1) return {};
    const yOffsets = [-4, 2, -2, 0];
    return {
      marginLeft: index === 0 ? "0px" : "-8px",
      transform: `translateY(${yOffsets[index]}px)`,
      zIndex: total - index,
    };
  };

  return (
    <>
      {recipients.slice(0, 4).map((recipient, index) => (
        <div
          key={index}
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
          style={getOffset(index, recipients.length)}
        >
          {recipient.avatar ? (
            <img
              src={recipient.avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-400 dark:via-gray-500 dark:to-gray-400 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-10 pointer-events-none" />
              <span className="relative text-white text-base font-medium">
                {recipient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// Main component
export function ChatHeader({
  isNewChat,
  recipientInput,
  setRecipientInput,
  onBack,
  isMobileView,
  activeConversation,
  onUpdateRecipients,
  onCreateConversation,
  onUpdateConversationName,
  unreadCount,
  showCompactNewChat = false,
  setShowCompactNewChat = () => {},
}: ChatHeaderProps) {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isEditMode && activeConversation?.recipients) {
      setRecipientInput(activeConversation.recipients.map(r => r.name).join(",") + ",");
    }
  }, [isEditMode, activeConversation]);

  // Computed values
  const displayPeople = useMemo(() => {
    const currentRecipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const combined = [...techPersonalities];
    const userContacts = getUserContacts();
    
    // Add user contacts, avoiding duplicates
    userContacts.forEach(contact => {
      if (!combined.some(p => p.name.toLowerCase() === contact.name.toLowerCase())) {
        combined.push(contact);
      }
    });

    // Filter out current recipients and by search value
    const filtered = combined.filter(person => {
      const matchesSearch = !searchValue || person.name.toLowerCase().includes(searchValue.toLowerCase());
      const notSelected = !currentRecipients.includes(person.name);
      return matchesSearch && notSelected;
    });

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchValue, recipientInput]);

  // Handlers
  const updateRecipients = useCallback(() => {
    if (isNewChat || isEditMode) {
      const recipientNames = recipientInput.split(",").filter((r) => r.trim());

      if (isEditMode && recipientNames.length === 0) {
        toast({ description: "You need at least one recipient" });
        return;
      }

      if (isNewChat && !isMobileView && recipientNames.length === 0) {
        toast({ description: "Please add at least one recipient" });
        return;
      }

      if (isEditMode && recipientNames.length > 0 && !searchValue) {
        setIsEditMode(false);
        onUpdateRecipients?.(recipientNames);
      } else if (isNewChat && (!isMobileView || recipientNames.length > 0) && !searchValue) {
        onCreateConversation?.(recipientNames);
      }
      if (!searchValue) {
        setSearchValue("");
      }
    }
  }, [
    isNewChat,
    isEditMode,
    recipientInput,
    onUpdateRecipients,
    onCreateConversation,
    toast,
    isMobileView,
    searchValue,
  ]);

  const handleHeaderClick = () => {
    if (!isNewChat && !isEditMode && !isMobileView) {
      setIsEditMode(true);
      const recipients =
        activeConversation?.recipients.map((r) => r.name).join(",") || "";
      setRecipientInput(recipients + ",");
    } else if (isNewChat && showCompactNewChat) {
      setShowCompactNewChat?.(false);
      setShowResults(true);
      setSearchValue("");
      setSelectedIndex(-1);
      if (!recipientInput.split(",").filter(r => r.trim()).length) {
        setRecipientInput("");
      }
    }
  };

  const handlePersonSelect = (person: (typeof techPersonalities)[0]) => {
    const currentRecipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (currentRecipients.includes(person.name)) return;

    if (hasReachedMaxRecipients(recipientInput)) {
      toast({ description: "You can add up to four recipients" });
      return;
    }

    // Save the person as a contact for future use
    addUserContact(person.name);

    const newValue = recipientInput
      ? recipientInput
          .split(",")
          .filter((r) => r.trim())
          .concat(person.name)
          .join(",")
      : person.name;
    setRecipientInput(newValue + ",");
    setSearchValue("");
    setShowResults(!hasReachedMaxRecipients(newValue));
    setSelectedIndex(-1);
  };

  const handleAddContact = async () => {
    if (searchValue.trim()) {
      try {
        setIsValidating(true);
        const response = await fetch('/api/validate-contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: searchValue.trim() }),
        });
        const data = await response.json();
        
        if (data.validation === false) {
          toast({
            description: "Please enter a valid contact name",
          });
          return;
        }
        
        handlePersonSelect({ name: searchValue.trim(), title: "Personal Contact" });
        setShowResults(true); // Keep the dropdown open for more selections
      } catch {
        toast({
          description: "Failed to validate contact name",
        });
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === "Backspace" && !searchValue) {
      e.preventDefault();
      const recipients = recipientInput.split(",").filter((r) => r.trim());
      if (recipients.length > 0) {
        const newRecipients = recipients.slice(0, -1).join(",");
        setRecipientInput(newRecipients + ",");
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setShowResults(false);
      setSelectedIndex(-1);
      updateRecipients();
      return;
    }

    if (!showResults) return;

    switch (e.key) {
      case "Enter": {
        e.preventDefault();
        if (displayPeople.length === 0 && searchValue.trim()) {
          handleAddContact();
          return;
        }
        if (selectedIndex >= 0 && selectedIndex < displayPeople.length) {
          handlePersonSelect(displayPeople[selectedIndex]);
        }
        break;
      }
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < displayPeople.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
    }
  };

  // Effects
  useEffect(() => {
    if (isNewChat) {
      setShowResults(true);
    }
  }, [isNewChat]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isCloseButton = (event.target as Element).closest(
        'button[aria-label^="Remove"]'
      );

      if (isCloseButton) {
        event.stopPropagation();
        return;
      }

      if (
        !event.target ||
        !(event.target as Element).closest('[data-chat-header="true"]')
      ) {
        if (isEditMode) {
          setIsEditMode(false);
        } else if (isNewChat && !isMobileView) {
          setShowCompactNewChat?.(true);
        }
        
        setShowResults(false);
        setSearchValue("");
        setSelectedIndex(-1);
        updateRecipients();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNewChat, isEditMode, isMobileView, updateRecipients]);

  // Render helpers
  const renderRecipients = () => {
    console.log("in renderRecipients");
    const recipients = recipientInput.split(",");
    const completeRecipients = recipients.slice(0, -1);

    return completeRecipients.map((recipient, index) => (
      <RecipientPill
        key={`${recipient}-${index}`}
        recipient={recipient}
        index={index}
        onRemove={(index) => {
          const newRecipients = recipientInput
            .split(",")
            .filter((r) => r.trim())
            .filter((_, i) => i !== index)
            .join(",");
          setRecipientInput(newRecipients + ",");
          if (isEditMode && onUpdateRecipients) {
            onUpdateRecipients(newRecipients.split(",").filter(r => r.trim()));
          }
        }}
        isMobileView={isMobileView}
      />
    ));
  };

  return (
    <div className="sticky top-0 z-10 flex flex-col w-full bg-background/50 backdrop-blur-md border-b">
      {isMobileView ? (
        <div
          className="flex items-center justify-between px-4 relative min-h-24 py-2"
          onClick={handleHeaderClick}
          data-chat-header="true"
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="absolute left-2 top-8 w-12">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isNewChat) {
                    setRecipientInput("");
                    setSearchValue("");
                    setShowResults(false);
                  }
                  onBack?.();
                }}
                className="rounded-sm relative flex items-center gap-2"
                aria-label="Back to conversations"
              >
                <Icons.back />
                {unreadCount ? (
                  <div className="bg-[#0A7CFF] text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium -ml-4">
                    {unreadCount}
                  </div>
                ) : null}
              </button>
            </div>

            {(isNewChat && !showCompactNewChat) || isEditMode ? (
              <div className="flex-1 pl-16" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 flex-wrap py-6">
                  <div className="absolute left-16 top-9">
                    <span className="text-base sm:text-sm text-muted-foreground">
                      To:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1 items-center pl-4">
                    {renderRecipients()}
                    {recipientInput.split(",").filter((r) => r.trim()).length < 4 && (
                      <RecipientSearch
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        showResults={showResults}
                        selectedIndex={selectedIndex}
                        handleKeyDown={handleKeyDown}
                        handlePersonSelect={handlePersonSelect}
                        handleAddContact={handleAddContact}
                        setSelectedIndex={setSelectedIndex}
                        setShowResults={setShowResults}
                        updateRecipients={updateRecipients}
                        isMobileView={isMobileView}
                        recipientInput={recipientInput}
                        isValidating={isValidating}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex absolute left-1/2 -translate-x-1/2 transform"
                onClick={handleHeaderClick}
                data-chat-header="true"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center py-2">
                    <MobileAvatars
                      recipients={
                        isNewChat
                          ? recipientInput
                              .split(",")
                              .filter((r) => r.trim())
                              .map((name) => ({ name }))
                          : activeConversation?.recipients || []
                      }
                    />
                  </div>
                  <span className="text-xs flex items-center">
                    {(() => {
                      if (!isNewChat && activeConversation?.name) {
                        return activeConversation.name;
                      }
                      const recipients = isNewChat
                        ? recipientInput.split(",").filter((r) => r.trim())
                        : activeConversation?.recipients.map((r) => r.name) || [];
                      return recipients.length === 1
                        ? recipients[0]
                        : `${recipients.length} people`;
                    })()}
                    {isMobileView && !isNewChat && activeConversation && (
                      <ContactDrawer 
                        recipients={activeConversation?.recipients.map(recipient => {
                          const personality = techPersonalities.find(p => p.name === recipient.name);
                          return {
                            name: recipient.name,
                            avatar: recipient.avatar,
                            bio: personality?.bio,
                            title: personality?.title
                          };
                        }) || []} 
                        conversationName={activeConversation?.name}
                        onUpdateName={onUpdateConversationName}
                        onAddContact={() => {
                          setIsEditMode(true);
                        }}
                      />
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Desktop View
        <div
          className="flex items-center justify-between px-4 relative h-16"
          onClick={handleHeaderClick}
          data-chat-header="true"
        >
          <div className="flex items-center gap-2 flex-1">
            {(isNewChat && !showCompactNewChat) || isEditMode ? (
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 flex-wrap py-6">
                  <span className="text-base sm:text-sm text-muted-foreground">
                    To:
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1 items-center">
                    {renderRecipients()}
                    {recipientInput.split(",").filter((r) => r.trim()).length < 4 && (
                      <RecipientSearch
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        showResults={showResults}
                        selectedIndex={selectedIndex}
                        handleKeyDown={handleKeyDown}
                        handlePersonSelect={handlePersonSelect}
                        handleAddContact={handleAddContact}
                        setSelectedIndex={setSelectedIndex}
                        setShowResults={setShowResults}
                        updateRecipients={updateRecipients}
                        isMobileView={isMobileView}
                        recipientInput={recipientInput}
                        isValidating={isValidating}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex"
                onClick={handleHeaderClick}
                data-chat-header="true"
              >
                <span className="text-sm">
                  <span className="text-muted-foreground">To: </span>
                  {(() => {
                    if (!isNewChat && activeConversation?.name) {
                      return activeConversation.name;
                    }
                    const recipients =
                      activeConversation?.recipients.map((r) => r.name) || [];
                    return recipients.length <= 3
                      ? recipients.join(", ")
                      : `${recipients[0]}, ${recipients[1]}, ${recipients[2]} +${
                          recipients.length - 3
                        }`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
