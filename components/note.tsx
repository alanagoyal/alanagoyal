"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef } from "react";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
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

          if (note.id && sessionId && updatedNote.title && updatedNote.emoji && updatedNote.content) {
            await supabase.rpc("update_note", {
              uuid_arg: note.id,
              session_arg: sessionId,
              title_arg: updatedNote.title,
              emoji_arg: updatedNote.emoji,
              content_arg: updatedNote.content,
            });
          }

          await fetch("/revalidate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ slug: note.slug }),
          });
          router.refresh();
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [note, supabase, router, sessionId]
  );

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} canEdit={canEdit} />
      <NoteContent note={note} saveNote={saveNote} canEdit={canEdit} />
    </div>
  );
}