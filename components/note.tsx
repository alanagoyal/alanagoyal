"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext, useEffect } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<typeof note>>({});
  const isSavingRef = useRef(false);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  // Flush pending changes to database
  const flushPendingUpdates = useCallback(async () => {
    if (isSavingRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    if (!note.id || !sessionId) {
      return;
    }

    isSavingRef.current = true;
    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {};

    try {
      // Use the new partial update function that only updates provided fields
      // Pass sentinel value for fields that should not be updated
      await supabase.rpc("update_note_partial", {
        uuid_arg: note.id,
        session_arg: sessionId,
        title_arg: updates.title !== undefined ? updates.title : '___NO_UPDATE___',
        emoji_arg: updates.emoji !== undefined ? updates.emoji : '___NO_UPDATE___',
        content_arg: updates.content !== undefined ? updates.content : '___NO_UPDATE___',
      });

      // Only revalidate and refresh if this is a public note
      if (note.public) {
        await fetch("/notes/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
          },
          body: JSON.stringify({ slug: note.slug }),
        });
        router.refresh();
      }

      // Refresh session notes less frequently - only on title/emoji changes
      // Content changes don't affect the sidebar
      if (updates.title !== undefined || updates.emoji !== undefined) {
        refreshSessionNotes();
      }
    } catch (error) {
      console.error("Save failed:", error);
      // Re-add failed updates to pending queue
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    } finally {
      isSavingRef.current = false;
    }
  }, [note.id, note.slug, note.public, sessionId, supabase, router, refreshSessionNotes]);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Update local state immediately (optimistic update)
      const updatedNote = { ...note, ...updates };
      setNote(updatedNote);

      // Accumulate pending changes instead of replacing them
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to flush accumulated changes
      saveTimeoutRef.current = setTimeout(() => {
        flushPendingUpdates();
      }, 500);
    },
    [note, flushPendingUpdates]
  );

  // Immediate save function for blur/unmount events
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    flushPendingUpdates();
  }, [flushPendingUpdates]);

  // Save on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        // Synchronous flush on unmount
        const updates = { ...pendingUpdatesRef.current };
        if (note.id && sessionId) {
          supabase.rpc("update_note_partial", {
            uuid_arg: note.id,
            session_arg: sessionId,
            title_arg: updates.title !== undefined ? updates.title : '___NO_UPDATE___',
            emoji_arg: updates.emoji !== undefined ? updates.emoji : '___NO_UPDATE___',
            content_arg: updates.content !== undefined ? updates.content : '___NO_UPDATE___',
          });
        }
      }
    };
  }, [note.id, sessionId, supabase]);

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} saveImmediately={saveImmediately} canEdit={canEdit} />
      <NoteContent note={note} saveNote={saveNote} saveImmediately={saveImmediately} canEdit={canEdit} />
    </div>
  );
}