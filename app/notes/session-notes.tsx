"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useState,
  useTransition,
} from "react";

export interface SessionNotes {
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  refreshSessionNotes: () => Promise<void>;
}

export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
});

export function SessionNotesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const refreshSessionNotes = useCallback(async () => {
    // Use startTransition to make this non-blocking
    // This allows the UI to remain responsive during the refresh
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        setSessionId,
        refreshSessionNotes,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
