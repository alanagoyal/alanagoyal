"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<typeof note>>({});

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Update local state immediately (optimistic update)
      setNote((prevNote: typeof note) => ({ ...prevNote, ...updates }));

      // Accumulate all pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Set new timeout to batch save all pending updates
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (note.id && sessionId && Object.keys(pendingUpdatesRef.current).length > 0) {
            const updatesToSave = pendingUpdatesRef.current;

            // Clear pending updates before making calls
            pendingUpdatesRef.current = {};

            // Make all necessary RPC calls for the accumulated updates
            if ('title' in updatesToSave) {
              await supabase.rpc("update_note_title", {
                uuid_arg: note.id,
                session_arg: sessionId,
                title_arg: updatesToSave.title,
              });
            }
            if ('emoji' in updatesToSave) {
              await supabase.rpc("update_note_emoji", {
                uuid_arg: note.id,
                session_arg: sessionId,
                emoji_arg: updatesToSave.emoji,
              });
            }
            if ('content' in updatesToSave) {
              await supabase.rpc("update_note_content", {
                uuid_arg: note.id,
                session_arg: sessionId,
                content_arg: updatesToSave.content,
              });
            }

            // Revalidate and refresh after all updates
            await fetch("/notes/revalidate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
              },
              body: JSON.stringify({ slug: note.slug }),
            });
            refreshSessionNotes();
            router.refresh();
          }
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [note.id, note.slug, supabase, router, refreshSessionNotes, sessionId]
  );

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} canEdit={canEdit} />
      <NoteContent note={note} saveNote={saveNote} canEdit={canEdit} />
    </div>
  );
}