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

  // Store note metadata in ref to avoid stale closures
  const noteMetadataRef = useRef({ id: note.id, slug: note.slug, public: note.public });
  useEffect(() => {
    noteMetadataRef.current = { id: note.id, slug: note.slug, public: note.public };
  }, [note.id, note.slug, note.public]);

  // Flush pending changes to database
  const flushPendingUpdates = useCallback(async () => {
    if (isSavingRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    const { id, slug, public: isPublic } = noteMetadataRef.current;

    if (!id || !sessionId) {
      return;
    }

    isSavingRef.current = true;
    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {};

    try {
      // Use the new partial update function that only updates provided fields
      // Pass sentinel value for fields that should not be updated
      await supabase.rpc("update_note_partial", {
        uuid_arg: id,
        session_arg: sessionId,
        title_arg: updates.title !== undefined ? updates.title : '___NO_UPDATE___',
        emoji_arg: updates.emoji !== undefined ? updates.emoji : '___NO_UPDATE___',
        content_arg: updates.content !== undefined ? updates.content : '___NO_UPDATE___',
      });

      // Only revalidate and refresh if this is a public note
      if (isPublic) {
        await fetch("/notes/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
          },
          body: JSON.stringify({ slug }),
        });
        router.refresh();
      }

      // Refresh session notes to update the sidebar
      // The sidebar displays title, emoji, AND content preview
      refreshSessionNotes();
    } catch (error) {
      console.error("Save failed:", error);
      // Re-add failed updates to pending queue
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    } finally {
      isSavingRef.current = false;
    }
  }, [sessionId, supabase, router, refreshSessionNotes]);

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

  // Immediate save function for blur events
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    flushPendingUpdates();
  }, [flushPendingUpdates]);

  // Sync state when navigating between different notes
  useEffect(() => {
    setNote(initialNote);
    // Clear any pending updates when switching notes
    pendingUpdatesRef.current = {};
  }, [initialNote.id]);

  // Save on unmount - flush any pending changes before component destroys
  useEffect(() => {
    return () => {
      // If there are pending changes, try to flush them
      // This is best-effort since we can't await in cleanup
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        const { id, slug } = noteMetadataRef.current;
        const updates = { ...pendingUpdatesRef.current };

        // Fire-and-forget save attempt
        // Note: This may not complete if the page unloads quickly
        // The blur handlers are the primary data loss prevention mechanism
        if (id && sessionId) {
          void supabase.rpc("update_note_partial", {
            uuid_arg: id,
            session_arg: sessionId,
            title_arg: updates.title !== undefined ? updates.title : '___NO_UPDATE___',
            emoji_arg: updates.emoji !== undefined ? updates.emoji : '___NO_UPDATE___',
            content_arg: updates.content !== undefined ? updates.content : '___NO_UPDATE___',
          });
        }
      }
    };
  }, [sessionId, supabase]);

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} saveImmediately={saveImmediately} canEdit={canEdit} />
      <NoteContent note={note} saveNote={saveNote} saveImmediately={saveImmediately} canEdit={canEdit} />
    </div>
  );
}