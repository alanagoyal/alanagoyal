"use client";

import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Note } from "@/lib/notes/types";

export interface SessionNotes {
  sessionId: string;
  notes: Note[];
  isReady: boolean;
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  isReady: false,
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionIdState] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isReady, setIsReady] = useState(false);

  const setSessionId = useCallback((nextSessionId: string) => {
    setSessionIdState(nextSessionId);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("session_id", nextSessionId);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
      setIsReady(true);
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const existing = localStorage.getItem("session_id");
      if (existing) {
        setSessionIdState(existing);
        return;
      }

      const generated =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("session_id", generated);
      setSessionIdState(generated);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    setIsReady(false);

    async function loadInitialSessionNotes() {
      const sessionNotes = await getSessionNotes({ supabase, sessionId });
      if (cancelled) return;
      setNotes(sessionNotes || []);
      setIsReady(true);
    }

    loadInitialSessionNotes();

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes,
        isReady,
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
