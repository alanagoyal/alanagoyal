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
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionId] = useState<string>("");

  // Initialize from localStorage cache to prevent layout shift on refresh
  const [notes, setNotes] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sessionNotes');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Return cached notes if they exist
          return parsedCache.notes || [];
        }
      } catch (error) {
        // Silently fail on localStorage errors (quota exceeded, parse errors, etc.)
        console.warn('Failed to load cached session notes:', error);
      }
    }
    return [];
  });

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);

      // Cache results in localStorage for next load
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sessionNotes', JSON.stringify({
            sessionId,
            notes: notes || [],
            timestamp: Date.now()
          }));
        } catch (error) {
          // Silently fail on localStorage errors (quota exceeded, private browsing, etc.)
          console.warn('Failed to cache session notes:', error);
        }
      }
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    refreshSessionNotes();
  }, [refreshSessionNotes, sessionId, supabase]);

  // Invalidate cache when sessionId changes
  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sessionNotes');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Clear notes if cached sessionId doesn't match current sessionId
          if (parsedCache.sessionId && parsedCache.sessionId !== sessionId) {
            setNotes([]);
          }
        }
      } catch (error) {
        console.warn('Failed to validate cached session notes:', error);
      }
    }
  }, [sessionId]);

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
