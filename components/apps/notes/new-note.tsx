"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";
import SessionId from "./session-id";
import { createNote } from "@/lib/notes/create-note";
import { SessionNotesContext } from "@/app/(desktop)/notes/session-notes";
import { Note } from "@/lib/notes/types";
import { useWindowFocus } from "@/lib/window-focus-context";

export default function NewNote({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
  useCallbackNavigation = false,
  onNoteCreated,
}: {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: Note) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const windowFocus = useWindowFocus();

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const handleCreateNote = useCallback(() => {
    clearSearch();
    createNote(
      sessionId,
      router,
      addNewPinnedNote,
      refreshSessionNotes,
      setSelectedNoteSlug,
      isMobile,
      useCallbackNavigation,
      onNoteCreated
    );
  }, [
    sessionId,
    router,
    addNewPinnedNote,
    clearSearch,
    refreshSessionNotes,
    setSelectedNoteSlug,
    isMobile,
    useCallbackNavigation,
    onNoteCreated,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Check if this app should handle the shortcut
      // In desktop mode (windowFocus exists), check if this window is focused
      // In standalone mode, check if target is within this app
      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        if (!target.closest('[data-app="notes"]')) return;
      }

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
  }, [handleCreateNote, windowFocus]);

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