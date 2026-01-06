"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/notes/session-notes";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "./sidebar";
import Note from "./note";

export function NotesApp() {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
        // Select "about-me" by default, or the first note
        const defaultNote = data.find((n: NoteType) => n.slug === "about-me") || data[0];
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
  }, [supabase]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    // Fetch full note data using RPC
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();
    if (fullNote) {
      setSelectedNote(fullNote as NoteType);
    }
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SessionNotesProvider>
      <div className="h-full flex bg-background text-foreground">
        <Sidebar
          notes={notes}
          onNoteSelect={handleNoteSelect}
          isMobile={false}
          selectedSlug={selectedNote?.slug}
          isDesktop={true}
        />
        <div className="flex-grow h-full overflow-hidden">
          <ScrollArea className="h-full" isMobile={false}>
            {selectedNote ? (
              <div className="w-full min-h-full p-3">
                <Note note={selectedNote} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a note</p>
              </div>
            )}
          </ScrollArea>
        </div>
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
