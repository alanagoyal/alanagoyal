"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { useToast } from "./ui/use-toast";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { refreshSessionNotes, updateNoteLocally, notes } = useContext(SessionNotesContext);
  const { toast } = useToast();

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Optimistic update locally
      const updatedNote = { ...note, ...updates };
      setNote(updatedNote);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (note.id && sessionId) {
            // Build parallel RPC calls array
            const promises = [];

            if ('title' in updates) {
              promises.push(
                supabase.rpc("update_note_title", {
                  uuid_arg: note.id,
                  session_arg: sessionId,
                  title_arg: updatedNote.title,
                })
              );
            }
            if ('emoji' in updates) {
              promises.push(
                supabase.rpc("update_note_emoji", {
                  uuid_arg: note.id,
                  session_arg: sessionId,
                  emoji_arg: updatedNote.emoji,
                })
              );
            }
            if ('content' in updates) {
              promises.push(
                supabase.rpc("update_note_content", {
                  uuid_arg: note.id,
                  session_arg: sessionId,
                  content_arg: updatedNote.content,
                })
              );
            }

            // Execute all RPC calls in parallel
            const results = await Promise.all(promises);

            // Check for errors in RPC results
            results.forEach((result, index) => {
              if (result.error) {
                console.error(`RPC call ${index} failed:`, result.error);
                throw result.error;
              }
            });

            // Check if note exists in sidebar
            const noteExistsInSidebar = notes.some(n => n.id === note.id);

            if (noteExistsInSidebar) {
              // Update sidebar optimistically (no DB refetch)
              updateNoteLocally(note.id, updates);
            } else {
              // For brand new notes not yet in sidebar, do a full refresh
              await refreshSessionNotes();
            }

            // Only revalidate ISR cache for public notes
            if (note.public) {
              await fetch("/notes/revalidate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
                },
                body: JSON.stringify({ slug: note.slug }),
              });
            }

            // Refresh router cache to ensure fresh data on navigation
            // This ensures when user navigates away and back, they see updated data
            router.refresh();
          }
        } catch (error) {
          console.error("Save failed:", error);
          // Revert optimistic update on error
          setNote(note);
          toast({
            description: "Failed to save note",
            variant: "destructive",
          });
        }
      }, 500);
    },
    [note, supabase, sessionId, updateNoteLocally, notes, refreshSessionNotes, toast]
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