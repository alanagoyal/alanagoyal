"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface SessionIdProps {
  setSessionId: (id: string) => void;
}

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export default function SessionId({ setSessionId }: SessionIdProps) {
  useEffect(() => {
    // Try to get from cookie first, then localStorage as fallback for migration
    let currentSessionId = getCookie("session_id");

    if (!currentSessionId) {
      // Check localStorage for existing session (migration path)
      currentSessionId = localStorage.getItem("session_id") || uuidv4();
      // Store in cookie
      setCookie("session_id", currentSessionId);
    }

    // Also keep localStorage in sync for now
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }

    setSessionId(currentSessionId);
  }, [setSessionId]);

  return null;
}
