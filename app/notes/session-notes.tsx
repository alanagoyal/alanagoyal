"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export interface SessionNotes {
  sessionId: string;
  refreshSessionNotes: () => void;
  optimisticNotes: any[];
  addOptimisticNote: (note: any) => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  refreshSessionNotes: () => {},
  optimisticNotes: [],
  addOptimisticNote: () => {},
});

export function SessionNotesProvider({
  children,
  initialSessionId,
}: {
  children: React.ReactNode;
  initialSessionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticNotes, setOptimisticNotes] = useState<any[]>([]);

  // Sync session ID to localStorage for client-side consistency
  useMemo(() => {
    if (typeof window !== 'undefined' && initialSessionId) {
      const localSessionId = localStorage.getItem("session_id");
      if (localSessionId !== initialSessionId) {
        localStorage.setItem("session_id", initialSessionId);
      }
    }
  }, [initialSessionId]);

  // Add a note optimistically before the server refresh completes
  const addOptimisticNote = useCallback((note: any) => {
    setOptimisticNotes(prev => [...prev, note]);
  }, []);

  // Refresh session notes by triggering a router refresh
  // This will re-fetch data from the server and update the UI
  const refreshSessionNotes = useCallback(() => {
    startTransition(() => {
      router.refresh();
      // Clear optimistic notes after refresh completes
      setOptimisticNotes([]);
    });
  }, [router]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId: initialSessionId,
        refreshSessionNotes,
        optimisticNotes,
        addOptimisticNote,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
