"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { withDisplayCreatedAtForNotes } from "@/lib/notes/display-created-at";

export function useNotesData() {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [notesForFallback, setNotesForFallback] = useState<NoteType[]>([]);
  const [sessionIdForSidebar, setSessionIdForSidebar] = useState<string>("");
  const [sessionNotesForSidebar, setSessionNotesForSidebar] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotes() {
      try {
        const sessionId =
          typeof window !== "undefined" ? localStorage.getItem("session_id") : null;

        const [publicResult, sessionResult] = await Promise.all([
          supabase
            .from("notes")
            .select("*")
            .eq("public", true)
            .order("created_at", { ascending: false }),
          sessionId
            ? supabase.rpc("select_session_notes", { session_id_arg: sessionId })
            : Promise.resolve({ data: [] as NoteType[] }),
        ]);

        if (cancelled) return;

        const publicNotes = (publicResult.data as NoteType[] | null) ?? [];
        const sessionNotes = (sessionResult.data as NoteType[] | null) ?? [];
        const normalizedSessionNotes = withDisplayCreatedAtForNotes(sessionNotes);
        const allNotes = [...publicNotes, ...sessionNotes];
        const uniqueBySlug = new Map<string, NoteType>();
        for (const note of allNotes) {
          uniqueBySlug.set(note.slug, note);
        }

        setSessionIdForSidebar(sessionId ?? "");
        setSessionNotesForSidebar(normalizedSessionNotes);
        setNotes(withDisplayCreatedAtForNotes(publicNotes));
        setNotesForFallback(withDisplayCreatedAtForNotes(Array.from(uniqueBySlug.values())));
      } catch (error) {
        console.error("Failed to fetch notes for sidebar/fallback selection:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return {
    loading,
    notes,
    notesForFallback,
    sessionIdForSidebar,
    sessionNotesForSidebar,
    supabase,
  };
}
