"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useState,
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

  const refreshSessionNotes = useCallback(async () => {
    // Trigger server re-fetch which will get fresh data
    router.refresh();
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
