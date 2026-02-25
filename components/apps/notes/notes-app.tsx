"use client";

import { useRef } from "react";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { useWindowFocus } from "@/lib/window-focus-context";
import { useNotesData } from "./hooks/use-notes-data";
import { useNotesSelection } from "./hooks/use-notes-selection";
import { NotesMobilePresenter } from "./presenters/notes-mobile-presenter";
import { NotesDesktopPresenter } from "./presenters/notes-desktop-presenter";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  initialSlug?: string;
  initialNote?: NoteType;
}

export function NotesApp({
  isMobile = false,
  inShell = false,
  initialSlug,
  initialNote,
}: NotesAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();
  const {
    loading,
    notes,
    notesForFallback,
    sessionIdForSidebar,
    sessionNotesForSidebar,
    supabase,
  } = useNotesData();
  const {
    handleBackToSidebar,
    handleNoteCreated,
    handleNoteSelect,
    selectedNote,
    selectedSlugForSidebar,
  } = useNotesSelection({
    initialNote,
    isMobile,
    isWindowFocused: windowFocus?.isFocused ?? false,
    loading,
    notes,
    notesForFallback,
    supabase,
  });

  const showSidebar = isMobile && !initialSlug;

  if (isMobile) {
    return (
      <SessionNotesProvider
        initialSessionId={sessionIdForSidebar}
        initialNotes={sessionNotesForSidebar}
      >
        <NotesMobilePresenter
          containerRef={containerRef}
          handleBackToSidebar={handleBackToSidebar}
          handleNoteCreated={handleNoteCreated}
          handleNoteSelect={handleNoteSelect}
          loading={loading}
          notes={notes}
          selectedNote={selectedNote}
          selectedSlugForSidebar={selectedSlugForSidebar}
          showSidebar={showSidebar}
        />
      </SessionNotesProvider>
    );
  }

  if (loading) {
    return <div className="h-full bg-background" />;
  }

  return (
    <SessionNotesProvider
      initialSessionId={sessionIdForSidebar}
      initialNotes={sessionNotesForSidebar}
    >
      <NotesDesktopPresenter
        containerRef={containerRef}
        handleNoteCreated={handleNoteCreated}
        handleNoteSelect={handleNoteSelect}
        inShell={inShell}
        notes={notes}
        selectedNote={selectedNote}
        selectedSlugForSidebar={selectedSlugForSidebar}
        windowFocus={windowFocus}
      />
    </SessionNotesProvider>
  );
}
