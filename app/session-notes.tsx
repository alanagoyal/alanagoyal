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
  refreshSessionNotes: () => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionId, setSessionId] = useState<string>("");
  const [notes, setNotes] = useState<any[]>([]);
  const [refreshSessionNotes, setRefreshSessionNotes] = useState(0);

  const runRefreshSessionNotes = useCallback(() => {
    setRefreshSessionNotes((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (sessionId) {
      getSessionNotes({ supabase, sessionId }).then((notes) =>
        setNotes(notes || [])
      );
    }
  }, [sessionId, refreshSessionNotes, supabase]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes,
        setSessionId,
        refreshSessionNotes: runRefreshSessionNotes,
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
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("session_id", sessionId);
  return notes;
}
