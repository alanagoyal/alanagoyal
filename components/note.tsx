"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";

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

  return (
    <div className="h-full overflow-y-auto">
      <NoteHeader note={note} saveNote={autosaveNote} />
      <NoteContent note={note} saveNote={autosaveNote} />
    </div>
  );
}
