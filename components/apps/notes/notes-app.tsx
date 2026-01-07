"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "./sidebar";
import Note from "./note";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, use callback navigation instead of route navigation
  initialSlug?: string; // If provided, select this note on load
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug }: NotesAppProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const supabase = createClient();
  // Container ref for scoping dialogs to this app
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch public notes on mount
  useEffect(() => {
    async function fetchNotes() {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("public", true)
        .order("created_at", { ascending: false });

      if (data) {
        setNotes(data);
        // Use initialSlug if provided, otherwise "about-me", otherwise first note
        const targetSlug = initialSlug || "about-me";
        const defaultNote = data.find((n: NoteType) => n.slug === targetSlug) || data[0];
        if (defaultNote && !selectedNote) {
          // Fetch full note data using RPC
          const { data: fullNote } = await supabase
            .rpc("select_note", { note_slug_arg: defaultNote.slug })
            .single();
          if (fullNote) {
            setSelectedNote(fullNote as NoteType);
          }
        }
      }
      setLoading(false);
    }
    fetchNotes();
  }, [supabase, initialSlug]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    // Fetch full note data using RPC
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();
    if (fullNote) {
      setSelectedNote(fullNote as NoteType);
      // Update URL to reflect selected note (shallow update, no navigation)
      if (inShell) {
        window.history.replaceState(null, "", `/notes/${note.slug}`);
      }
      // On mobile, hide sidebar when note is selected
      if (isMobile) {
        setShowSidebar(false);
      }
    }
  }, [supabase, isMobile, inShell]);

  const handleBackToSidebar = useCallback(() => {
    setShowSidebar(true);
  }, []);

  // Show empty background while loading to prevent flash
  if (loading) {
    return <div className="h-full bg-background" />;
  }

  // On mobile, show either sidebar or note content
  if (isMobile) {
    return (
      <SessionNotesProvider>
        <div
          ref={containerRef}
          data-app="notes"
          tabIndex={-1}
          onMouseDown={() => containerRef.current?.focus()}
          className="notes-app h-full bg-background text-foreground outline-none"
        >
          {showSidebar ? (
            <Sidebar
              notes={notes}
              onNoteSelect={handleNoteSelect}
              isMobile={true}
              selectedSlug={selectedNote?.slug}
              isDesktop={inShell}
            />
          ) : (
            <div className="h-full">
              {selectedNote && (
                <div className="p-3">
                  <Note key={selectedNote.id} note={selectedNote} onBack={handleBackToSidebar} />
                </div>
              )}
            </div>
          )}
        </div>
      </SessionNotesProvider>
    );
  }

  // Desktop view - show both sidebar and note
  return (
    <SessionNotesProvider>
      <div
        ref={containerRef}
        data-app="notes"
        tabIndex={-1}
        onMouseDown={() => containerRef.current?.focus()}
        className="notes-app h-full flex bg-background text-foreground relative outline-none"
      >
        <Sidebar
          notes={notes}
          onNoteSelect={handleNoteSelect}
          isMobile={false}
          selectedSlug={selectedNote?.slug}
          isDesktop={true}
          onNoteCreated={setSelectedNote}
          dialogContainer={containerRef.current}
        />
        <div className="flex-grow h-full overflow-hidden">
          <ScrollArea className="h-full" isMobile={false} bottomMargin="0px">
            {selectedNote ? (
              <div className="w-full p-3">
                <Note key={selectedNote.id} note={selectedNote} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a note</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </SessionNotesProvider>
  );
}
