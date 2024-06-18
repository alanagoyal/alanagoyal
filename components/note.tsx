"use client";

import { createClient } from "@/utils/supabase/client";
import NewNoteContent from "./new-note-content";
import NewNoteHeader from "./new-note-header";
import NoteContent from "./note-content";
import NoteHeader from "./note-header";
import { useRouter } from "next/navigation";

export default function Note({ note }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();

  const autosaveNote = async (updates: any) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update(updates)
        .match({ id: note.id });

      if (error) throw error;
    } catch (error) {
      console.error("Autosave failed:", error);
    }
    router.refresh();
  };

  if (note.slug && note.slug.includes("new-note")) {
    return (
      <div>
        <NewNoteHeader note={note} saveNote={autosaveNote} />
        <NewNoteContent note={note} saveNote={autosaveNote} />
      </div>
    );
  }
  return (
    <div>
      <NoteHeader note={note} />
      <NoteContent note={note} />
    </div>
  );
}
