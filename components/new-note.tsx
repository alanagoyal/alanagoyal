"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Icons } from "./icons";
import SessionId from "./session-id";
import { createNote } from "@/lib/create-note";
import { SessionNotesContext } from "@/app/session-notes";
import { toast } from "./ui/use-toast";

export default function NewNote({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
}: {
  addNewPinnedNote: (slug: string, isNewNote: boolean) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const router = useRouter();

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const handleCreateNote = useCallback(async () => {
    clearSearch();
    setIsCreatingNote(true);
    try {
      const newSlug = await createNote(sessionId);
      
      await router.push(`/${newSlug}`);
      setSelectedNoteSlug(newSlug);
      addNewPinnedNote(newSlug, true); 
      await refreshSessionNotes();
      
      toast({
        description: "Private note created",
      });
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        variant: "destructive",
        description: "Failed to create note. Please try again.",
      });
    } finally {
      setIsCreatingNote(false);
    }
  }, [sessionId, router, addNewPinnedNote, refreshSessionNotes, setSelectedNoteSlug, clearSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (event.key === "n" && !event.metaKey && !isTyping) {
        event.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateNote]);

  return (
    <div className="flex flex-col items-center justify-center">
      <SessionId setSessionId={setSessionId} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            onClick={handleCreateNote}
            aria-label="Create new note"
            className={isMobile ? "p-2" : ""}
            disabled={isCreatingNote}
          >
            {isCreatingNote ? (
              <Icons.spinner className={`animate-spin ${isMobile ? "size-6" : "size-5"}`} />
            ) : (
              <Icons.new className={isMobile ? "size-6" : "size-5"} />
            )}
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1c1c] text-gray-400 border-none">
            Create a note
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}