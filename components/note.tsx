"use client";

import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext, useEffect } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { persistNoteFields, revalidateNote, NoteField } from "@/lib/note-persistence";
import { Note as NoteType } from "@/lib/types";

export default function Note({ note: initialNote }: { note: NoteType }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");

  // Separate timeout refs for each field to prevent race conditions
  const saveTimeoutRefs = useRef<Record<NoteField, NodeJS.Timeout | null>>({
    title: null,
    content: null,
    emoji: null,
  });

  // Track which fields have pending saves
  const pendingSaves = useRef<Set<NoteField>>(new Set());

  const { updateNoteInContext, notes } = useContext(SessionNotesContext);

  // Sync note state from context if it has more recent data
  // This handles the case where we navigate away and back before saves complete
  useEffect(() => {
    const contextNote = notes.find(n => n.id === initialNote.id);
    if (contextNote) {
      // Only update if we don't have pending saves (to avoid overwriting user input)
      if (pendingSaves.current.size === 0) {
        setNote(contextNote);
      }
    }
  }, [notes, initialNote.id]);

  /**
   * Save a specific field to the database with independent debouncing
   * This prevents race conditions where one field's save cancels another's
   */
  const saveField = useCallback(
    async (field: NoteField, value: string) => {
      // Clear only THIS field's timeout (not others!)
      if (saveTimeoutRefs.current[field]) {
        clearTimeout(saveTimeoutRefs.current[field]!);
      }

      // Update local state immediately (optimistic update)
      const updatedNote = { ...note, [field]: value };
      setNote(updatedNote);

      // Update context optimistically (keeps sidebar in sync without refetching)
      updateNoteInContext(note.id, { [field]: value });

      // Mark this field as having a pending save
      pendingSaves.current.add(field);

      // Debounce THIS field independently
      saveTimeoutRefs.current[field] = setTimeout(async () => {
        try {
          if (note.id && sessionId) {
            // Persist to database
            const result = await persistNoteFields(note.id, sessionId, {
              [field]: value,
            } as Partial<Pick<NoteType, NoteField>>);

            if (!result.success) {
              console.error(`Failed to save ${field}:`, result.error);
              // TODO: Show error toast to user
              return;
            }

            // Only revalidate for public notes (ISR cache)
            if (note.public) {
              await revalidateNote(note.slug);
            }
          }
        } catch (error) {
          console.error(`Save failed for ${field}:`, error);
          // TODO: Show error toast to user
        } finally {
          // Mark save as complete
          pendingSaves.current.delete(field);
        }
      }, 500);
    },
    [note, sessionId, updateNoteInContext]
  );

  /**
   * Flush all pending saves immediately
   * Called on blur or unmount to prevent data loss
   * Note: This is fire-and-forget on unmount, but optimistic updates in context
   * ensure the UI shows the latest state even if DB save is pending
   */
  const flushPendingSaves = useCallback(() => {
    // Clear all timeouts
    Object.entries(saveTimeoutRefs.current).forEach(([field, timeout]) => {
      if (timeout) {
        clearTimeout(timeout);
        saveTimeoutRefs.current[field as NoteField] = null;
      }
    });

    // Save all pending fields immediately
    if (pendingSaves.current.size > 0 && note.id && sessionId) {
      const updates: Partial<Pick<NoteType, NoteField>> = {};

      pendingSaves.current.forEach(field => {
        updates[field] = note[field] as any;
      });

      // Fire off the save
      // The optimistic update in context ensures UI consistency
      // even if this hasn't completed when we navigate away
      persistNoteFields(note.id, sessionId, updates)
        .then(() => {
          pendingSaves.current.clear();
        })
        .catch((error) => {
          console.error("Failed to flush pending saves:", error);
        });
    }
  }, [note, sessionId]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      flushPendingSaves();
    };
  }, [flushPendingSaves]);

  // Flush pending saves before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaves.current.size > 0) {
        // Show browser warning if there are unsaved changes
        e.preventDefault();
        e.returnValue = '';
        flushPendingSaves();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushPendingSaves]);

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader
        note={note}
        onTitleChange={(value) => saveField('title', value)}
        onEmojiChange={(value) => saveField('emoji', value)}
        onBlur={flushPendingSaves}
        canEdit={canEdit}
      />
      <NoteContent
        note={note}
        onContentChange={(value) => saveField('content', value)}
        onBlur={flushPendingSaves}
        canEdit={canEdit}
      />
    </div>
  );
}