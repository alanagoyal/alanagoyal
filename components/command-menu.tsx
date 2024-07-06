"use client"

import { useEffect, useState, useCallback } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command"
import { DialogTitle, DialogDescription } from "./ui/dialog"
import { useRouter } from "next/navigation"
import { Icons } from "./icons"
import { Pin, ArrowUp, ArrowDown } from "lucide-react";
import { createNote } from "@/lib/create-note";
import { searchNotes } from "@/lib/search";
import { Note } from "@/lib/types";

export function CommandMenu({ notes, sessionId, addNewPinnedNote, navigateNotes, togglePinned, selectedNoteSlug }: { notes: Note[], sessionId: string, addNewPinnedNote: (slug: string) => void, navigateNotes: (direction: 'up' | 'down') => void, togglePinned: (slug: string) => void, selectedNoteSlug: string | null }) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  function toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  }

  const handleCreateNote = () => {
    createNote(sessionId, router, addNewPinnedNote);
    setOpen(false);
  };

  const handleNoteSelect = (slug: string) => {
    router.push(`/${slug}`);
    setOpen(false);
  };

  const handleMoveUp = useCallback(() => {
    navigateNotes('up');
    setOpen(false);
  }, [navigateNotes]);

  const handleMoveDown = useCallback(() => {
    navigateNotes('down');
    setOpen(false);
  }, [navigateNotes]);

  const handleTogglePin = useCallback(() => {
    if (selectedNoteSlug) {
      togglePinned(selectedNoteSlug);
      setOpen(false);
    }
  }, [selectedNoteSlug, togglePinned]);

  const commands = [
    { name: "New note", icon: <Icons.new />, shortcut: "N", action: handleCreateNote },
    { name: "Pin or unpin", icon: <Pin />, shortcut: "P", action: handleTogglePin },
    { name: "Move up", icon: <ArrowUp />, shortcut: "K", action: handleMoveUp },
    { name: "Move down", icon: <ArrowDown />, shortcut: "J", action: handleMoveDown },
  ];

  const filteredNotes = searchNotes(notes, searchTerm, sessionId);
  const filteredCommands = commands.filter((command) => 
    command.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Menu</DialogTitle>
      <DialogDescription className="sr-only">Use this dialog to execute commands or search for a note</DialogDescription>
      <CommandInput placeholder="Type a command or search for a note..." value={searchTerm} onValueChange={setSearchTerm} />
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
              <CommandItem key={note.id} onSelect={() => handleNoteSelect(note.slug)}>
                {note.emoji} {toTitleCase(note.title)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
