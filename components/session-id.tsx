"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface SessionIdProps {
  setSessionId: (id: string) => void;
}

export default function SessionId({ setSessionId }: SessionIdProps) {
  useEffect(() => {
    const currentSessionId = localStorage.getItem("session_id") || uuidv4();
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }

    // Set cookie so session ID is available server-side for immediate note loading
    document.cookie = `session_id=${currentSessionId}; path=/; max-age=31536000; SameSite=Lax`;

    setSessionId(currentSessionId);
  }, [setSessionId]);

  return null;
}
