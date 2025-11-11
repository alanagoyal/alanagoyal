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
  refreshSessionNotes: () => Promise<void>;
  optimisticNotes: any[];
  addOptimisticNote: (note: any) => void;
  removeOptimisticNote: (slug: string) => void;
  updateOptimisticNote: (slug: string, updates: Partial<any>) => void;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  refreshSessionNotes: async () => {},
  optimisticNotes: [],
  addOptimisticNote: () => {},
  removeOptimisticNote: () => {},
  updateOptimisticNote: () => {},
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

  // Add a note optimistically before the server insert completes
  const addOptimisticNote = useCallback((note: any) => {
    setOptimisticNotes(prev => [...prev, note]);
  }, []);

  // Remove a specific optimistic note (for error handling)
  const removeOptimisticNote = useCallback((slug: string) => {
    setOptimisticNotes(prev => prev.filter(note => note.slug !== slug));
  }, []);

  // Update an existing optimistic note (for live editing)
  const updateOptimisticNote = useCallback((slug: string, updates: Partial<any>) => {
    setOptimisticNotes(prev =>
      prev.map(note => note.slug === slug ? { ...note, ...updates } : note)
    );
  }, []);

  // Refresh session notes by triggering a router refresh
  // Returns a promise that resolves when the transition completes
  const refreshSessionNotes = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      startTransition(() => {
        router.refresh();
        // Clear optimistic notes after refresh starts
        // The transition will handle timing
        setTimeout(() => {
          setOptimisticNotes([]);
          resolve();
        }, 100); // Small delay to ensure refresh has started
      });
    });
  }, [router]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId: initialSessionId,
        refreshSessionNotes,
        optimisticNotes,
        addOptimisticNote,
        removeOptimisticNote,
        updateOptimisticNote,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
