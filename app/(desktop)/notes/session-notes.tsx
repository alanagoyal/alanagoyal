"use client";

import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Note } from "@/lib/notes/types";

export interface SessionNotes {
  sessionId: string;
  notes: Note[];
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
});

export function SessionNotesProvider({
  children,
  initialSessionId,
  initialNotes,
}: {
  children: React.ReactNode;
  initialSessionId?: string;
  initialNotes?: Note[];
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionId] = useState<string>(initialSessionId ?? "");
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const seededSessionIdRef = useRef(initialSessionId ?? "");
  const skipInitialFetchRef = useRef((initialSessionId ?? "").length > 0 && (initialNotes ?? []).length > 0);

  useEffect(() => {
    const seedSessionId = initialSessionId ?? "";
    const seedNotes = initialNotes ?? [];
    const hasSeedData = seedSessionId.length > 0 || seedNotes.length > 0;
    if (!hasSeedData) return;

    // Session identity changed: re-seed provider state from incoming bootstrap data.
    if (seededSessionIdRef.current !== seedSessionId) {
      seededSessionIdRef.current = seedSessionId;
      setSessionId(seedSessionId);
      setNotes(seedNotes);
      return;
    }

    // Same session: only backfill notes when provider is still empty.
    if (seedNotes.length > 0) {
      setNotes((current) => (current.length === 0 ? seedNotes : current));
    }
  }, [initialSessionId, initialNotes]);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    refreshSessionNotes();
  }, [refreshSessionNotes, sessionId, supabase]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes,
        setSessionId,
        refreshSessionNotes,
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
