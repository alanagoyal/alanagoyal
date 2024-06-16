"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface SessionIdProps {
  setSessionId: (id: string) => void; // Prop to pass the sessionId to the parent component
}

export default function SessionId({ setSessionId }: SessionIdProps) {
  useEffect(() => {
    const currentSessionId = localStorage.getItem("session_id") || uuidv4();
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }
    setSessionId(currentSessionId); // Use the passed function to update the parent's state
  }, [setSessionId]);

  return null; // This component does not need to render anything
}
