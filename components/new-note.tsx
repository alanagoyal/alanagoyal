"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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

export default function NewNote({ addNewPinnedNote, clearSearch }: { addNewPinnedNote: (slug: string) => void, clearSearch: () => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleCreateNote = useCallback(() => {
    clearSearch();
    createNote(sessionId, router, addNewPinnedNote, startTransition);
  }, [sessionId, router, addNewPinnedNote, clearSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.isContentEditable ||
                       target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.tagName === 'SELECT';

      if (event.key === 'n' && !event.metaKey && !isTyping) {
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
          <TooltipTrigger onClick={handleCreateNote} aria-label="Create new note">
            {pending ? <div className="pr-1 pt-1"><Icons.spinner /></div > : <Icons.new /> }
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1c1c] text-gray-400 border-none">
            Create a note
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}