"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Note from "./note";

// Client-side cache for note content
const noteCache = new Map<string, any>();

export default function NoteLoader({ slug }: { slug: string }) {
  const [note, setNote] = useState<any>(noteCache.get(slug) || null);
  const [loading, setLoading] = useState(!noteCache.has(slug));
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // If note is already cached, use it immediately
    if (noteCache.has(slug)) {
      setNote(noteCache.get(slug));
      setLoading(false);
      return;
    }

    // Otherwise fetch it
    const fetchNote = async () => {
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
