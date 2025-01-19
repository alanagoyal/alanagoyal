"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";
import SessionId from "./session-id";
import { createNote } from "@/lib/create-note";
import { SessionNotesContext } from "@/app/notes/session-notes";

export default function NewNote({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
}: {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const handleCreateNote = useCallback(() => {
    clearSearch();
    createNote(
      sessionId,
      router,
      addNewPinnedNote,
      refreshSessionNotes,
      setSelectedNoteSlug,
      isMobile
    );
  }, [
    sessionId,
    router,
    addNewPinnedNote,
    clearSearch,
    refreshSessionNotes,
    setSelectedNoteSlug,
    isMobile,
  ]);

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
      <button
        onClick={handleCreateNote}
        aria-label="Create new note"
        className={`sm:p-2 hover:bg-muted-foreground/10 rounded-lg ${isMobile ? "p-2" : ""}`}
      >
        <Icons.new />
      </button>
    </div>
  );
}