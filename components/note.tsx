"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext, useEffect } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";

export default function Note({ note: initialNote, slug }: { note: any; slug?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const { refreshSessionNotes, updateNoteInContext, notes: sessionNotes } = useContext(SessionNotesContext);

  // If server didn't find the note, try to get it from context (for newly created notes)
  const noteFromContext = slug && !initialNote
    ? sessionNotes.find(n => n.slug === slug)
    : null;

  const [note, setNote] = useState(initialNote || noteFromContext);
  const [sessionId, setSessionId] = useState("");

  // Refs for managing saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<typeof note>>({});
  const isSavingRef = useRef(false);

  /**
   * Sync with context when note is found in session notes
   * This ensures we use the latest data from context instead of stale server data
   */
  useEffect(() => {
    if (!initialNote && slug) {
      // New note: load from context
      const contextNote = sessionNotes.find(n => n.slug === slug);
      if (contextNote && !note) {
        setNote(contextNote);
      }
    } else if (initialNote) {
      // Existing note: sync updates from context
      const contextNote = sessionNotes.find(n => n.id === initialNote.id);
      if (contextNote && (contextNote.title !== note?.title || contextNote.content !== note?.content || contextNote.emoji !== note?.emoji)) {
        setNote(contextNote);
      }
    }
  }, [sessionNotes, initialNote, slug, note]);

  /**
   * Performs the actual database save with accumulated pending updates.
   * This function is called either:
   * 1. After the debounce timeout (500ms of no edits)
   * 2. Immediately on blur events
   * 3. On component unmount
   */
  const performSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    isSavingRef.current = true;

    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {}; // Clear pending updates

    try {
      if (note.id && sessionId) {
        // Single batched RPC call for all field updates
        await supabase.rpc("update_note_batched", {
          uuid_arg: note.id,
          session_arg: sessionId,
          title_arg: 'title' in updates ? updates.title : null,
          emoji_arg: 'emoji' in updates ? updates.emoji : null,
          content_arg: 'content' in updates ? updates.content : null,
        });

        // Only revalidate ISR cache, don't refetch session notes
        // (sidebar already has optimistic updates)
        await fetch("/notes/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
          },
          body: JSON.stringify({ slug: note.slug }),
        });
      }
    } catch (error) {
      console.error("Save failed:", error);

      // Re-add failed updates to pending queue for retry
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Auto-retry after 2 seconds
      setTimeout(() => {
        performSave();
      }, 2000);
    } finally {
      isSavingRef.current = false;
    }
  }, [note.id, note.slug, sessionId, supabase]);

  /**
   * Queues updates and schedules a debounced save.
   * Updates are accumulated in pendingUpdatesRef instead of replacing each other.
   * This prevents the race condition where rapid field switches lose data.
   */
  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Clear existing debounce timer
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Optimistically update UI immediately
      const updatedNote = { ...note, ...updates };
      setNote(updatedNote);

      // Optimistically update sidebar context immediately
      // This ensures sidebar shows changes without refetching
      if (note.id) {
        updateNoteInContext(note.id, updates);
      }

      // Accumulate updates (don't replace - this fixes the race condition!)
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      };

      // Schedule debounced save (500ms after last edit)
      saveTimeoutRef.current = setTimeout(() => {
        performSave();
      }, 500);
    },
    [note, performSave, updateNoteInContext]
  );

  /**
   * Immediate save function for blur events.
   * Cancels debounce and saves immediately when user leaves a field.
   */
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  /**
   * Save on component unmount (e.g., navigation away from note)
   * Uses fire-and-forget approach since component is unmounting
   */
  useEffect(() => {
    return () => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        // Fire-and-forget save on unmount
        performSave();
      }
    };
  }, [performSave]);

  /**
   * Save before page unload (e.g., closing tab, refreshing)
   * Synchronous save to prevent data loss
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        e.preventDefault();
        performSave();
        // Modern browsers ignore custom messages, but we set it anyway
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [performSave]);

  // If note is not found in server or context, redirect to error page
  if (!note) {
    router.push("/notes/error");
    return null;
  }

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader
        note={note}
        saveNote={saveNote}
        saveImmediately={saveImmediately}
        canEdit={canEdit}
      />
      <NoteContent
        note={note}
        saveNote={saveNote}
        saveImmediately={saveImmediately}
        canEdit={canEdit}
      />
    </div>
  );
}