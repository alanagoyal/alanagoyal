"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/session-notes";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const updatedNote = { ...note, ...updates };
      setNote(updatedNote);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (note.id && sessionId) {
            if ('title' in updates) {
              await supabase.rpc("update_note_title", {
                uuid_arg: note.id,
                session_arg: sessionId,
                title_arg: updatedNote.title,
              });
            }
            if ('emoji' in updates) {
              await supabase.rpc("update_note_emoji", {
                uuid_arg: note.id,
                session_arg: sessionId,
                emoji_arg: updatedNote.emoji,
              });
            }
            if ('content' in updates) {
              await supabase.rpc("update_note_content", {
                uuid_arg: note.id,
                session_arg: sessionId,
                content_arg: updatedNote.content,
              });
            }
          }

          await fetch("/revalidate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ slug: note.slug }),
          });
          refreshSessionNotes();
          router.refresh();
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [note, supabase, router, refreshSessionNotes, sessionId]
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