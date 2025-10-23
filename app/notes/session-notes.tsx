"use client";

import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { Session } from "inspector";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Note } from "@/lib/types";

export interface SessionNotes {
  sessionId: string;
  notes: Note[];
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
  addOptimisticNote: (note: Note) => void;
  updateNoteInContext: (noteId: string, updates: Partial<Note>) => void;
  removeNoteFromContext: (noteId: string) => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
  addOptimisticNote: () => {},
  updateNoteInContext: () => {},
  removeNoteFromContext: () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionId] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
    }
  }, [supabase, sessionId]);

  /**
   * Add a note optimistically (before DB confirmation)
   * Used for instant UI when creating new notes
   */
  const addOptimisticNote = useCallback((note: Note) => {
    setNotes(prev => [note, ...prev]);
  }, []);

  /**
   * Update a note in the context without refetching from DB
   * Used for optimistic updates during editing
   */
  const updateNoteInContext = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    ));
  }, []);

  /**
   * Remove a note from the context
   * Used after deletion
   */
  const removeNoteFromContext = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  useEffect(() => {
    refreshSessionNotes();
  }, [refreshSessionNotes, sessionId, supabase]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes,
        setSessionId,
        refreshSessionNotes,
        addOptimisticNote,
        updateNoteInContext,
        removeNoteFromContext,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}

async function getSessionNotes({
  supabase,
  sessionId,
}: {
  supabase: SupabaseClient;
  sessionId: string;
}) {

  const { data : notes } = await supabase.rpc("select_session_notes", {
    session_id_arg: sessionId
  });

  return notes;
}
