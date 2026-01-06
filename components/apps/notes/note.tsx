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
  const noteRef = useRef(initialNote);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Update local state immediately (optimistic update)
      setNote((prevNote: typeof note) => {
        const updatedNote = { ...prevNote, ...updates };
        noteRef.current = updatedNote;
        return updatedNote;
      });

      // Accumulate all pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Set new timeout to batch save all pending updates
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (noteRef.current.id && sessionId && Object.keys(pendingUpdatesRef.current).length > 0) {
            const updatesToSave = pendingUpdatesRef.current;
            const currentNote = noteRef.current;

            // Clear pending updates before making calls
            pendingUpdatesRef.current = {};

            // Make RPC calls only for fields that were actually updated
            // This prevents overwriting unchanged fields with stale data
            const promises = [];

            if ('title' in updatesToSave) {
              promises.push(
                supabase.rpc("update_note_title", {
                  uuid_arg: currentNote.id,
                  session_arg: sessionId,
                  title_arg: updatesToSave.title,
                })
              );
            }
            if ('emoji' in updatesToSave) {
              promises.push(
                supabase.rpc("update_note_emoji", {
                  uuid_arg: currentNote.id,
                  session_arg: sessionId,
                  emoji_arg: updatesToSave.emoji,
                })
              );
            }
            if ('content' in updatesToSave) {
              promises.push(
                supabase.rpc("update_note_content", {
                  uuid_arg: currentNote.id,
                  session_arg: sessionId,
                  content_arg: updatesToSave.content,
                })
              );
            }

            // Execute all updates in parallel for efficiency
            await Promise.all(promises);

            // Revalidate and refresh after all updates
            await fetch("/notes/revalidate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
              },
              body: JSON.stringify({ slug: currentNote.slug }),
            });
            refreshSessionNotes();
            router.refresh();
          }
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [supabase, router, refreshSessionNotes, sessionId]
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