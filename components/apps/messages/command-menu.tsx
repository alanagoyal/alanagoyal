"use client";

import {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Icons } from "./icons";
import { Conversation } from "@/types/messages";
import { useTheme } from "next-themes";

export interface CommandMenuProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (conversations: Conversation[]) => void;
  ref: React.RefObject<{ setOpen: (open: boolean) => void }>;
  onOpenChange?: (open: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  container?: HTMLElement | null;
}

export const CommandMenu = forwardRef<
  { setOpen: (open: boolean) => void },
  CommandMenuProps
>(
  (
    {
      conversations,
      activeConversation,
      onNewChat,
      onSelectConversation,
      onDeleteConversation,
      onUpdateConversation,
      onOpenChange,
      soundEnabled,
      onSoundToggle,
      container,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { setTheme, theme } = useTheme();

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        setOpen(newOpen);
        onOpenChange?.(newOpen);
      },
      [onOpenChange]
    );

    useImperativeHandle(ref, () => ({
      setOpen: (newOpen: boolean) => {
        handleOpenChange(newOpen);
      },
    }));

    useEffect(() => {
      if (open) {
        const timeoutId = setTimeout(() => {
          const input = document.querySelector(
            "[cmdk-input]"
          ) as HTMLInputElement;
          input?.focus();
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        setSearchTerm("");
      }
    }, [open]);

    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        // Only handle shortcuts if focus is within this app
        const target = e.target as HTMLElement;
        if (!target.closest('[data-app="messages"]')) return;

        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleOpenChange(!open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, [open, handleOpenChange]);

    const handleMoveUp = useCallback(() => {
      if (!activeConversation || conversations.length === 0) return;
      
      // Sort conversations in the same order as sidebar
      const sortedConvos = [...conversations].sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // Then sort by timestamp
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA; // Most recent first
      });

      const currentIndex = sortedConvos.findIndex(
        (conv) => conv.id === activeConversation
      );
      
      if (currentIndex > 0) {
        onSelectConversation(sortedConvos[currentIndex - 1].id);
      } else {
        onSelectConversation(sortedConvos[sortedConvos.length - 1].id);
      }
      handleOpenChange(false);
    }, [activeConversation, conversations, onSelectConversation, handleOpenChange]);

    const handleMoveDown = useCallback(() => {
      if (!activeConversation || conversations.length === 0) return;
      
      // Sort conversations in the same order as sidebar
      const sortedConvos = [...conversations].sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // Then sort by timestamp
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA; // Most recent first
      });

      const currentIndex = sortedConvos.findIndex(
        (conv) => conv.id === activeConversation
      );
      
      if (currentIndex < sortedConvos.length - 1) {
        onSelectConversation(sortedConvos[currentIndex + 1].id);
      } else {
        onSelectConversation(sortedConvos[0].id);
      }
      handleOpenChange(false);
    }, [activeConversation, conversations, onSelectConversation, handleOpenChange]);

    const handleTogglePin = useCallback(() => {
      if (!activeConversation) return;
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeConversation) {
          return { ...conv, pinned: !conv.pinned };
        }
        return conv;
      });
      onUpdateConversation(updatedConversations);
      handleOpenChange(false);
    }, [activeConversation, conversations, onUpdateConversation, handleOpenChange]);

    const handleToggleAlerts = useCallback(() => {
      if (!activeConversation) return;
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeConversation) {
          return { ...conv, hideAlerts: !conv.hideAlerts };
        }
        return conv;
      });
      onUpdateConversation(updatedConversations);
      handleOpenChange(false);
    }, [activeConversation, conversations, onUpdateConversation, handleOpenChange]);

    const handleDeleteConversation = useCallback(() => {
      if (!activeConversation) return;
      onDeleteConversation(activeConversation);
      handleOpenChange(false);
    }, [activeConversation, onDeleteConversation, handleOpenChange]);

    const commands = [
      {
        name: "New chat",
        icon: <Icons.send className="mr-2 h-4 w-4" />,
        shortcut: "N",
        action: () => {
          onNewChat();
          handleOpenChange(false);
        },
      },
      {
        name: "Pin or unpin",
        icon: <Icons.pin className="mr-2 h-4 w-4" />,
        shortcut: "P",
        action: handleTogglePin,
      },
      {
        name: "Move up",
        icon: <Icons.arrowUp className="mr-2 h-4 w-4" />,
        shortcut: "K",
        action: handleMoveUp,
      },
      {
        name: "Move down",
        icon: <Icons.arrowDown className="mr-2 h-4 w-4" />,
        shortcut: "J",
        action: handleMoveDown,
      },
      {
        name: activeConversation && conversations.find(c => c.id === activeConversation)?.hideAlerts ? "Show Alerts" : "Hide Alerts",
        icon: activeConversation && conversations.find(c => c.id === activeConversation)?.hideAlerts ? (
          <Icons.bell className="mr-2 h-4 w-4" />
        ) : (
          <Icons.bellOff className="mr-2 h-4 w-4" />
        ),
        shortcut: "H",
        action: handleToggleAlerts,
      },
      {
        name: "Delete chat",
        icon: <Icons.trash className="mr-2 h-4 w-4" />,
        shortcut: "D",
        action: handleDeleteConversation,
      },
      {
        name: theme === "light" ? "Dark mode" : "Light mode",
        icon:
          theme === "light" ? (
            <Icons.moon className="mr-2 h-4 w-4" />
          ) : (
            <Icons.sun className="mr-2 h-4 w-4" />
          ),
        shortcut: "T",
        action: () => {
          setTheme(theme === "light" ? "dark" : "light");
        },
      },
      {
        name: soundEnabled ? "Sound off" : "Sound on",
        icon: soundEnabled ? (
          <Icons.volumeX className="mr-2 h-4 w-4" />
        ) : (
          <Icons.volume2 className="mr-2 h-4 w-4" />
        ),
        shortcut: "S",
        action: () => {
          onSoundToggle();
          handleOpenChange(false);
        },
      },
    ];

    // Sort conversations in the same order as sidebar for display
    const sortedConversations = [...conversations].sort((a, b) => {
      // First sort by pinned status
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Then sort by timestamp
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Most recent first
    });

    const filteredConversations = sortedConversations.filter(
      (conv) =>
        conv.recipients.some((recipient) =>
          recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        conv.messages.some((message) =>
          message.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const filteredCommands = commands.filter((command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <CommandDialog open={open} onOpenChange={handleOpenChange} container={container}>
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Use this dialog to execute commands or search for a chat
        </DialogDescription>
        <CommandInput
          placeholder="Type a command or search for a chat..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          {filteredCommands.length > 0 && (
            <CommandGroup heading="Commands">
              {filteredCommands.map((command) => (
                <CommandItem key={command.name} onSelect={command.action}>
                  {command.icon}
                  <span>{command.name}</span>
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {filteredConversations.length > 0 && (
            <CommandGroup heading="Chats">
              {filteredConversations.map((conv) => (
                <CommandItem
                  key={conv.id}
                  onSelect={() => {
                    onSelectConversation(conv.id);
                    handleOpenChange(false);
                  }}
                >
                  <span className="mr-2">💬</span>
                  {conv.recipients.map((r) => r.name).join(", ")}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    );
  }
);

CommandMenu.displayName = "CommandMenu";
