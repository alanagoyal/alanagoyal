"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Note from "./note";

// Client-side cache for note content
const noteCache = new Map<string, any>();

export default function NoteLoader({ slug }: { slug: string }) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchNote = async () => {
      // Check cache first
      const cached = noteCache.get(slug);
      if (cached) {
        setNote(cached);
        setLoading(false);
        return;
      }

      // Fetch from database
      try {
        const { data } = await supabase.rpc("select_note", {
          note_slug_arg: slug,
        }).single();

        if (data) {
          noteCache.set(slug, data);
          setNote(data);
        } else {
          router.push("/notes/error");
        }
      } catch (error) {
        console.error("Error fetching note:", error);
        router.push("/notes/error");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [slug, supabase, router]);

  // Listen for note updates from the Note component
  useEffect(() => {
    const handleNoteUpdate = (event: CustomEvent) => {
      if (event.detail.slug === slug) {
        // Update cache with new note data
        noteCache.set(slug, event.detail.note);
        setNote(event.detail.note);
      }
    };

    window.addEventListener('note-updated' as any, handleNoteUpdate);
    return () => window.removeEventListener('note-updated' as any, handleNoteUpdate);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

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
  // Dispatch event to update any active NoteLoader
  window.dispatchEvent(new CustomEvent('note-updated', { detail: { slug, note } }));
}
