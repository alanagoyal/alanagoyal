"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Note from "./note";

// Client-side cache for note content (for fast navigation)
const noteCache = new Map<string, any>();

export default function NoteWrapper({ note: serverNote, slug }: { note: any; slug: string }) {
  const [note, setNote] = useState(serverNote);
  const router = useRouter();
  const supabase = createClient();

  // Populate cache with server-rendered note on mount
  useEffect(() => {
    if (serverNote) {
      noteCache.set(slug, serverNote);
    }
  }, [serverNote, slug]);

  // Listen for URL changes to load notes from cache
  useEffect(() => {
    const handleRouteChange = () => {
      // Check if we have this note cached
      const cached = noteCache.get(slug);
      if (cached && cached !== note) {
        setNote(cached);
      }
    };

    handleRouteChange();
  }, [slug, note]);

  // Listen for note updates
  useEffect(() => {
    const handleNoteUpdate = (event: CustomEvent) => {
      if (event.detail.slug === slug) {
        noteCache.set(slug, event.detail.note);
        setNote(event.detail.note);
      }
    };

    window.addEventListener("note-updated" as any, handleNoteUpdate);
    return () => window.removeEventListener("note-updated" as any, handleNoteUpdate);
  }, [slug]);

  return <Note note={note} />;
}

// Export function to clear cache when notes are updated
export function clearNoteCache(slug?: string) {
  if (slug) {
    noteCache.delete(slug);
  } else {
    noteCache.clear();
  }
}

// Export function to update cache
export function updateNoteCache(slug: string, note: any) {
  noteCache.set(slug, note);
  window.dispatchEvent(
    new CustomEvent("note-updated", { detail: { slug, note } })
  );
}
