import { Icons } from "./icons";
import { Conversation } from "@/types/messages";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { initialContacts } from "@/data/messages/initial-contacts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserContacts, addUserContact } from "@/lib/messages/contacts";
import { ContactDrawer } from "./contact-drawer";
import { useWindowFocus } from "@/lib/window-focus-context";

// Helper to check if we can add more recipients
const hasReachedMaxRecipients = (recipients: string) => {
  const currentRecipients = recipients.split(",").filter((r) => r.trim());
  return currentRecipients.length >= 4;
};

// Helper to validate recipient count
const isValidRecipientCount = (recipients: string[]) => {
  const filtered = recipients.filter(r => r.trim());
  return filtered.length >= 1 && filtered.length <= 4;
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
  onHideAlertsChange?: (hide: boolean) => void;
  unreadCount?: number;
  showCompactNewChat?: boolean;
  setShowCompactNewChat?: (show: boolean) => void;
  isDesktop?: boolean;
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
  handlePersonSelect: (person: (typeof initialContacts)[0]) => void;
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
    <div 
      className={cn("sm:inline", isMobileView && "w-full")}
      onMouseDown={(e) => {
        // Prevent the mousedown from reaching document level
        e.stopPropagation();
      }}
    >
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

  const ITEM_HEIGHT = 36;  // Height of each item in pixels
  const MAX_VISIBLE_ITEMS = 8;  // Maximum number of items to show before scrolling

  // Focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keep selected item in view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Filter people based on search value
  const displayPeople = useMemo(() => {
    const currentRecipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const combined = [...initialContacts];
    const userContacts = getUserContacts();

    // Add user contacts, avoiding duplicates
    userContacts.forEach((contact) => {
      if (
        !combined.some(
          (p) => p.name.toLowerCase() === contact.name.toLowerCase()
        )
      ) {
        combined.push(contact);
      }
    });

    // Filter out current recipients and by search value
    const filtered = combined.filter((person) => {
      const matchesSearch =
        !searchValue ||
        person.name.toLowerCase().includes(searchValue.toLowerCase());
      const notSelected = !currentRecipients.includes(person.name);
      return matchesSearch && notSelected;
    });

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchValue, recipientInput]);

  return (
    <div
      ref={searchRef}
      className={cn("relative", isMobileView ? "w-full" : "min-w-[250px] flex-1")}
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
          onFocus={() => {
            if (!hasReachedMaxRecipients(recipientInput)) {
              setShowResults(true);
            }
          }}
          placeholder="Type to add recipients..."
          className="flex-1 bg-transparent outline-none text-base sm:text-sm min-w-[120px] w-full select-text"
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
          className="absolute left-0 min-w-[250px] max-w-[300px] top-full mt-1 bg-background rounded-lg shadow-lg z-50"
          data-dropdown="true"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ScrollArea
            style={{
              height: `${Math.min(displayPeople.length * ITEM_HEIGHT, MAX_VISIBLE_ITEMS * ITEM_HEIGHT)}px`,
            }}
            className="w-full rounded-md border border-input bg-background"
            isMobile={isMobileView}
            bottomMargin="0"
          >
            <div>
              {displayPeople.map((person, index) => (
                <div
                  key={person.name}
                  ref={selectedIndex === index ? selectedItemRef : null}
                  className={`p-2 cursor-pointer rounded-md ${
                    selectedIndex === index
                      ? "bg-[#0A7CFF] hover:bg-[#0A7CFF]"
                      : ""
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
                        selectedIndex === index
                          ? "text-white"
                          : "text-[#0A7CFF]"
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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#9BA1AA] to-[#7D828A] relative">
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
  onHideAlertsChange,
  unreadCount,
  showCompactNewChat = false,
  setShowCompactNewChat = () => {},
  isDesktop = false,
}: ChatHeaderProps) {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isDropdownClick = target.closest('[data-dropdown]');
      const isPillRemoveClick = target.closest('button[aria-label^="Remove"]');
      const isHeaderClick = target.closest('[data-chat-header="true"]');

      // Don't handle dropdown clicks - just return without stopping propagation
      // so the dropdown's own handlers can process the click
      if (isDropdownClick) {
        return;
      }

      // Don't exit edit mode on remove button clicks
      if (isPillRemoveClick) {
        return;
      }

      // Handle clicks outside the header
      if (!isHeaderClick) {
        const currentRecipients = recipientInput.split(",").filter(r => r.trim());

        // Only exit edit mode if recipients are valid
        if (isEditMode || isNewChat) {
          if (isValidRecipientCount(currentRecipients)) {
            // Stop this click from propagating
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (isEditMode) {
              setIsEditMode(false);
              onUpdateRecipients?.(currentRecipients);
            } else if (isNewChat) {
              if (isMobileView) {
                setShowResults(false);
                onCreateConversation?.(currentRecipients);
              } else {
                setShowCompactNewChat?.(true);
                onCreateConversation?.(currentRecipients);
              }
            }

            // Add a capture event listener to block the next click
            const blockNextClick = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              document.removeEventListener('click', blockNextClick, true);
            };
            document.addEventListener('click', blockNextClick, true);
          } else {
            // Show error toast if trying to save invalid state
            toast({ 
              description: currentRecipients.length === 0 
                ? "You need at least one recipient" 
                : "You can add up to four recipients"
            });
            return;
          }
        }

        // Reset search state
        setShowResults(false);
        setSearchValue("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isNewChat, isEditMode, isMobileView, recipientInput, onUpdateRecipients, onCreateConversation, toast]);

  // Computed values
  const displayPeople = useMemo(() => {
    const currentRecipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const combined = [...initialContacts];
    const userContacts = getUserContacts();

    // Add user contacts, avoiding duplicates
    userContacts.forEach((contact) => {
      if (
        !combined.some(
          (p) => p.name.toLowerCase() === contact.name.toLowerCase()
        )
      ) {
        combined.push(contact);
      }
    });

    // Filter out current recipients and by search value
    const filtered = combined.filter((person) => {
      const matchesSearch =
        !searchValue ||
        person.name.toLowerCase().includes(searchValue.toLowerCase());
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
      } else if (
        isNewChat &&
        (!isMobileView || recipientNames.length > 0) &&
        !searchValue
      ) {
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

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Prevent clicks on dropdown or pill remove buttons from triggering header click
    const isDropdownClick = (e.target as Element).closest('[data-dropdown]');
    const isPillRemoveClick = (e.target as Element).closest('button[aria-label^="Remove"]');
    if (isDropdownClick || isPillRemoveClick) {
      e.stopPropagation();
      return;
    }

    // Desktop: clicking header in compact mode enters edit mode
    if (!isNewChat && !isEditMode && !isMobileView) {
      setIsEditMode(true);
      const recipients =
        activeConversation?.recipients.map((r) => r.name).join(",") || "";
      setRecipientInput(recipients + ",");
    }
    // Desktop: clicking header in new chat compact mode enters edit mode
    else if (isNewChat && showCompactNewChat && !isMobileView) {
      setShowCompactNewChat?.(false);
      setShowResults(true);
      setSearchValue("");
      setSelectedIndex(-1);
      if (!recipientInput.split(",").filter((r) => r.trim()).length) {
        setRecipientInput("");
      }
    }
    // Mobile: clicking header in compact mode does nothing (handled by ContactDrawer)
  };

  const handlePersonSelect = (person: (typeof initialContacts)[0]) => {
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
        const response = await fetch("/api/validate-contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

        handlePersonSelect({
          name: searchValue.trim(),
          title: "Personal Contact",
        });
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

  // Only set recipientInput when ENTERING edit mode, not on every activeConversation change
  const prevIsEditMode = useRef(isEditMode);
  useEffect(() => {
    // Only run when isEditMode changes from false to true
    if (isEditMode && !prevIsEditMode.current && activeConversation?.recipients) {
      setRecipientInput(
        activeConversation.recipients.map((r) => r.name).join(",") + ","
      );
    }
    prevIsEditMode.current = isEditMode;
  }, [isEditMode, activeConversation]);

  // Render helpers
  const renderRecipients = () => {
    const recipients = recipientInput.split(",");
    const completeRecipients = recipients.slice(0, -1);
    const totalRecipients = completeRecipients.filter(r => r.trim()).length;

    return completeRecipients.map((recipient, index) => (
      <RecipientPill
        key={`${recipient}-${index}`}
        recipient={recipient}
        index={index}
        onRemove={(index) => {
          // Prevent removing if it's the last recipient
          if (totalRecipients <= 1) {
            toast({ 
              description: "You must have at least one recipient" 
            });
            return;
          }

          const newRecipients = recipientInput
            .split(",")
            .filter((r) => r.trim())
            .filter((_, i) => i !== index)
            .join(",");
          setRecipientInput(newRecipients + ",");
          
          // Only update recipients if we're not in edit mode
          if (!isEditMode && onUpdateRecipients) {
            onUpdateRecipients(
              newRecipients.split(",").filter((r) => r.trim())
            );
          }
        }}
        isMobileView={isMobileView}
      />
    ));
  };

  return (
    <div className="z-10 flex flex-col w-full bg-background/50 backdrop-blur-md border-b select-none">
      {/* Mobile view */}
      {isMobileView ? (
        <div
          className="flex items-center justify-between px-4 relative min-h-24 py-2"
          onClick={handleHeaderClick}
          data-chat-header="true"
        >
          {/* Back button and unread count */}
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
                <Icons.back size={32} />
                {unreadCount ? (
                  <div className="bg-[#0A7CFF] text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium -ml-4">
                    {unreadCount}
                  </div>
                ) : null}
              </button>
            </div>
            {/* Mobile new chat or edit view */}
            {(isNewChat && !showCompactNewChat) || isEditMode ? (
              <div
                className="flex-1 pl-16"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 flex-wrap py-6">
                  <div className="absolute left-16 top-9">
                    <span className="text-base sm:text-sm text-muted-foreground">
                      To:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1 items-center pl-4">
                    {renderRecipients()}
                    {recipientInput.split(",").filter((r) => r.trim()).length <
                      4 && (
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
              // Mobile avatar view
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
                    {isMobileView && !isNewChat && activeConversation && (
                      <ContactDrawer
                        recipientCount={activeConversation.recipients.length}
                        recipients={
                          activeConversation?.recipients.map((recipient) => {
                            const contact = initialContacts.find(
                              (p) => p.name === recipient.name
                            );
                            return {
                              name: recipient.name,
                              avatar: recipient.avatar,
                              bio: contact?.bio,
                              title: contact?.title,
                            };
                          }) || []
                        }
                        onUpdateName={onUpdateConversationName}
                        conversationName={activeConversation.name}
                        onAddContact={() => {
                          setIsEditMode(true);
                        }}
                        onHideAlertsChange={onHideAlertsChange}
                        hideAlerts={activeConversation.hideAlerts}
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
          className="flex items-center justify-between px-4 relative min-h-16"
          onClick={handleHeaderClick}
          data-chat-header="true"
        >
          {/* Desktop new chat or edit view */}
          {(isNewChat && !showCompactNewChat) || isEditMode ? (
            <div className="flex items-start gap-2 flex-1 min-w-0" data-recipient-pills onClick={(e) => e.stopPropagation()}>
              <span className="text-sm text-muted-foreground flex-shrink-0 leading-8 pt-4">
                To:
              </span>
              <div className="flex flex-wrap gap-1 flex-1 items-center min-h-8 py-4 min-w-0">
                {renderRecipients()}
                {recipientInput.split(",").filter((r) => r.trim()).length <
                  4 && (
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
          ) : (
            // Desktop compact view
            <div
              className="flex items-center flex-1"
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
                    : `${recipients[0]}, ${recipients[1]}, ${
                        recipients[2]
                      } +${recipients.length - 3}`;
                })()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
