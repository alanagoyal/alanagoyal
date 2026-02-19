"use client";

import { createClient } from "@/utils/supabase/client";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/(desktop)/notes/session-notes";
import { Note as NoteType } from "@/lib/notes/types";

interface NoteProps {
  note: NoteType;
  onBack?: () => void; // Callback for back navigation in shell mode
  isMobile?: boolean;
}

export default function Note({ note: initialNote, onBack, isMobile = false }: NoteProps) {
  const supabase = createClient();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const [isEditing, setIsEditing] = useState(!initialNote.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<NoteType>>({});
  const noteRef = useRef(initialNote);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const saveNote = useCallback(
    async (updates: Partial<NoteType>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Update local state immediately (optimistic update)
      setNote((prevNote: NoteType) => {
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
          }
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [supabase, refreshSessionNotes, sessionId]
  );

  const canEdit = sessionId === note.session_id;

  const handleContentAreaClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger edit if clicking interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, textarea')) {
      return;
    }
    if (canEdit && !note.public) {
      setIsEditing(true);
    }
  }, [canEdit, note.public]);

  return (
    <div
      className="h-full overflow-y-auto bg-background"
      onClick={() => {
        // Exit edit mode when clicking anywhere outside the textarea
        if (isEditing) {
          setIsEditing(false);
        }
      }}
    >
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} canEdit={canEdit} onBack={onBack} isMobile={isMobile} />
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* Click target for entering edit mode - covers visible area */}
        {canEdit && !note.public && !isEditing && (
          <div
            className="absolute inset-0 z-0 cursor-text"
            onClick={() => setIsEditing(true)}
          />
        )}
        <div className="relative z-10" onClick={handleContentAreaClick}>
          <NoteContent
            note={note}
            saveNote={saveNote}
            canEdit={canEdit}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </div>
      </div>
    </div>
  );
}
