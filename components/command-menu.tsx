"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command"
import { DialogTitle, DialogDescription } from "./ui/dialog"
import { useRouter } from "next/navigation"
import { Icons } from "./icons"
import { Pin, ArrowUp, ArrowDown } from "lucide-react";

export function CommandMenu({ notes, sessionId }: { notes: any[], sessionId: string }) {
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
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
    if (value.length > 0) {
      const results = notes.filter(note =>
        (note.public || note.sessionId === sessionId) &&
        (note.title.toLowerCase().includes(value.toLowerCase()) ||
         note.content.toLowerCase().includes(value.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }

  function toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Menu</DialogTitle>
      <DialogDescription className="sr-only">Use this dialog to execute commands or search for a note</DialogDescription>
      <CommandInput placeholder="Type a command or search for a note..." onValueChange={handleSearch} />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem>
            <Icons.new />
            <span className="ml-2">Create a note</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Pin />
            <span className="ml-2">Pin or unpin</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <ArrowUp />
            <span className="ml-2">Move up</span>
            <CommandShortcut>K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <ArrowDown />
            <span className="ml-2">Move down</span>
            <CommandShortcut>J</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        {searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((note) => (
              <CommandItem key={note.id} onSelect={() => router.push(`/${note.slug}`)}>
                {toTitleCase(note.title)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}