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

export interface SessionNotes {
  sessionId: string;
  notes: any[];
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
  updateNoteInContext: (noteId: string, updates: any) => void;
  addNoteToContext: (note: any) => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
  updateNoteInContext: () => {},
  addNoteToContext: () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionId] = useState<string>("");
  const [notes, setNotes] = useState<any[]>([]);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
    }
  }, [supabase, sessionId]);

  /**
   * Optimistically update a note in the sidebar context
   * This ensures sidebar reflects changes immediately without refetching
   */
  const updateNoteInContext = useCallback((noteId: string, updates: any) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId
          ? { ...note, ...updates }
          : note
      )
    );
  }, []);

  /**
   * Optimistically add a new note to the sidebar context
   * This ensures newly created notes appear in sidebar immediately
   */
  const addNoteToContext = useCallback((note: any) => {
    setNotes((prevNotes) => [note, ...prevNotes]);
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
        updateNoteInContext,
        addNoteToContext,
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
