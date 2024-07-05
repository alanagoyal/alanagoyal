import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { DialogTitle, DialogDescription } from "./ui/dialog"

export function CommandMenu() {
    const [open, setOpen] = useState(false)
  
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
  
    return (
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">Use this dialog to execute commands or search</DialogDescription>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Create a note</CommandItem>
            <CommandItem>Next note</CommandItem>
            <CommandItem>Previous note</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    )
  }
