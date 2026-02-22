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
  // Intentionally bootstrap from initial props only once to avoid clobbering live context state
  // after mount. If a future flow needs runtime session switching, key this provider by session.
  const didHydrateFromInitialPropsRef = useRef(false);

  useEffect(() => {
    if (didHydrateFromInitialPropsRef.current) return;
    const hasInitialSessionId = typeof initialSessionId === "string" && initialSessionId.length > 0;
    const hasInitialNotes = Array.isArray(initialNotes) && initialNotes.length > 0;
    if (!hasInitialSessionId && !hasInitialNotes) return;

    setSessionId(initialSessionId ?? "");
    setNotes(initialNotes ?? []);
    didHydrateFromInitialPropsRef.current = true;
  }, [initialSessionId, initialNotes]);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
    }
  }, [supabase, sessionId]);

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
