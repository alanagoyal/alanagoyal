"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import { useState, useCallback, useRef } from "react";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveNote = useCallback(async (updates: Partial<typeof note>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const updatedNote = { ...note, ...updates };
    setNote(updatedNote);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("notes")
          .update(updatedNote)
          .match({ id: note.id });

        if (error) throw error;
      } catch (error) {
        console.error("Save failed:", error);
      }
      router.refresh();
    }, 500);
  }, [note, supabase, router]);

  return (
    <div className="h-full overflow-y-auto">
      <NoteHeader note={note} saveNote={saveNote} />
      <NoteContent note={note} saveNote={saveNote} />
    </div>
  );
}
