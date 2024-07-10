"use client";

import {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useContext,
} from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";
import { DialogTitle, DialogDescription } from "./ui/dialog";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";
import { Pin, ArrowUp, ArrowDown, Trash } from "lucide-react";
import { createNote } from "@/lib/create-note";
import { searchNotes } from "@/lib/search";
import { Note } from "@/lib/types";
import { SessionNotesContext } from "@/app/session-notes";

export interface CommandMenuProps {
  notes: Note[];
  sessionId: string;
  addNewPinnedNote: (slug: string) => void;
  navigateNotes: (direction: "up" | "down") => void;
  togglePinned: (slug: string) => void;
  deleteNote: (note: Note) => void;
  highlightedNote: Note | null;
  ref: React.RefObject<{ setOpen: (open: boolean) => void }>;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
}

export const CommandMenu = forwardRef<
  { setOpen: (open: boolean) => void },
  CommandMenuProps
>(
  (
    {
      notes,
      sessionId,
      addNewPinnedNote,
      navigateNotes,
      togglePinned,
      deleteNote,
      highlightedNote,
      setSelectedNoteSlug,
      isMobile,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useImperativeHandle(ref, () => ({
      setOpen: (newOpen: boolean) => {
        setOpen(newOpen);
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
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);

    function toTitleCase(str: string): string {
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );
    }

    const { refreshSessionNotes } = useContext(SessionNotesContext);

    const handleCreateNote = () => {
      createNote(
        sessionId,
        router,
        addNewPinnedNote,
        refreshSessionNotes,
        setSelectedNoteSlug,
        isMobile
      );
      setOpen(false);
    };

    const handleNoteSelect = (slug: string) => {
      router.push(`/${slug}`);
      setOpen(false);
    };

    const handleMoveUp = useCallback(() => {
      navigateNotes("up");
      setOpen(false);
    }, [navigateNotes]);

    const handleMoveDown = useCallback(() => {
      navigateNotes("down");
      setOpen(false);
    }, [navigateNotes]);

    const handleTogglePin = useCallback(() => {
      if (highlightedNote) {
        togglePinned(highlightedNote.slug);
        setOpen(false);
      }
    }, [highlightedNote, togglePinned]);

    const handleDeleteNote = useCallback(() => {
      if (highlightedNote) {
        deleteNote(highlightedNote);
        setOpen(false);
      }
    }, [highlightedNote, deleteNote]);

    const commands = [
      {
        name: "New note",
        icon: <Icons.new />,
        shortcut: "N",
        action: handleCreateNote,
      },
      {
        name: "Pin or unpin",
        icon: <Pin />,
        shortcut: "P",
        action: handleTogglePin,
      },
      {
        name: "Move up",
        icon: <ArrowUp />,
        shortcut: "K",
        action: handleMoveUp,
      },
      {
        name: "Move down",
        icon: <ArrowDown />,
        shortcut: "J",
        action: handleMoveDown,
      },
      {
        name: "Delete note",
        icon: <Trash />,
        shortcut: "D",
        action: handleDeleteNote,
      },
    ];

    const filteredNotes = searchNotes(notes, searchTerm, sessionId);
    const filteredCommands = commands.filter((command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Use this dialog to execute commands or search for a note
        </DialogDescription>
        <CommandInput
          placeholder="Type a command or search for a note..."
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
                  <span className="ml-2">{command.name}</span>
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {filteredNotes.length > 0 && (
            <CommandGroup heading="Notes">
              {filteredNotes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleNoteSelect(note.slug)}
                >
                  {note.emoji} {toTitleCase(note.title)}
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
