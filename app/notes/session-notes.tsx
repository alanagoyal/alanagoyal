"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useMemo,
} from "react";

export interface SessionNotes {
  sessionId: string;
  refreshSessionNotes: () => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  refreshSessionNotes: () => {},
});

export function SessionNotesProvider({
  children,
  initialSessionId,
}: {
  children: React.ReactNode;
  initialSessionId: string;
}) {
  const router = useRouter();

  // Sync session ID to localStorage for client-side consistency
  useMemo(() => {
    if (typeof window !== 'undefined' && initialSessionId) {
      const localSessionId = localStorage.getItem("session_id");
      if (localSessionId !== initialSessionId) {
        localStorage.setItem("session_id", initialSessionId);
      }
    }
  }, [initialSessionId]);

  // Refresh session notes by triggering a router refresh
  // This will re-fetch data from the server and update the UI
  const refreshSessionNotes = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId: initialSessionId,
        refreshSessionNotes,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
