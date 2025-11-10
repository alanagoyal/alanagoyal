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

  // Separate refs for each field to prevent race conditions
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track pending changes for each field
  const pendingChangesRef = useRef<{
    title?: string;
    content?: string;
    emoji?: string;
  }>({});

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  // Function to actually persist changes to database
  const persistChanges = useCallback(
    async (changes: { title?: string; content?: string; emoji?: string }) => {
      try {
        if (note.id && sessionId) {
          // Use batched RPC call to update all fields at once
          await supabase.rpc("update_note_batched", {
            uuid_arg: note.id,
            session_arg: sessionId,
            title_arg: changes.title ?? null,
            emoji_arg: changes.emoji ?? null,
            content_arg: changes.content ?? null,
          });

          // Only revalidate for public notes to reduce overhead
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

          // Refresh session notes in sidebar
          refreshSessionNotes();
        }
      } catch (error) {
        console.error("Save failed:", error);
      }
    },
    [note.id, note.slug, note.public, sessionId, supabase, router, refreshSessionNotes]
  );

  // Flush all pending changes immediately
  const flushPendingChanges = useCallback(() => {
    // Clear all timers
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    if (emojiTimeoutRef.current) clearTimeout(emojiTimeoutRef.current);

    // Get pending changes and clear them
    const changes = { ...pendingChangesRef.current };
    pendingChangesRef.current = {};

    // Persist if there are any changes
    if (Object.keys(changes).length > 0) {
      persistChanges(changes);
    }
  }, [persistChanges]);

  // Save with field-specific debouncing
  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Update local state immediately (optimistic update)
      const updatedNote = { ...note, ...updates };
      setNote(updatedNote);

      // Handle title updates
      if ('title' in updates) {
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current);
        }
        pendingChangesRef.current.title = updatedNote.title;

        titleTimeoutRef.current = setTimeout(() => {
          const titleToSave = pendingChangesRef.current.title;
          delete pendingChangesRef.current.title;
          if (titleToSave !== undefined) {
            persistChanges({ title: titleToSave });
          }
        }, 500);
      }

      // Handle content updates
      if ('content' in updates) {
        if (contentTimeoutRef.current) {
          clearTimeout(contentTimeoutRef.current);
        }
        pendingChangesRef.current.content = updatedNote.content;

        contentTimeoutRef.current = setTimeout(() => {
          const contentToSave = pendingChangesRef.current.content;
          delete pendingChangesRef.current.content;
          if (contentToSave !== undefined) {
            persistChanges({ content: contentToSave });
          }
        }, 500);
      }

      // Handle emoji updates (immediate, no debounce needed)
      if ('emoji' in updates) {
        if (emojiTimeoutRef.current) {
          clearTimeout(emojiTimeoutRef.current);
        }
        // Emoji is a discrete action, persist immediately
        persistChanges({ emoji: updatedNote.emoji });
      }
    },
    [note, persistChanges]
  );

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      flushPendingChanges();
    };
  }, [flushPendingChanges]);

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader
        note={note}
        saveNote={saveNote}
        canEdit={canEdit}
        flushPendingChanges={flushPendingChanges}
      />
      <NoteContent
        note={note}
        saveNote={saveNote}
        canEdit={canEdit}
        flushPendingChanges={flushPendingChanges}
      />
    </div>
  );
}