"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";
import { createNote } from "@/lib/create-note";
import { toast } from "@/components/ui/use-toast";
import { useMobileDetect } from "./mobile-detector";

export default function Note({
  note: initialNote,
  addNewPinnedNote,
  setSelectedNoteSlug,
}: {
  note: any;
  addNewPinnedNote?: (slug: string) => void;
  setSelectedNoteSlug?: (slug: string | null) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const isMobile = useMobileDetect();
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
        } catch (error) {
          console.error("Save failed:", error);
        }
      }, 500);
    },
    [note, supabase, router, refreshSessionNotes, sessionId]
  );

  const canEdit = sessionId === note.session_id;

  const handleDelete = useCallback(async () => {
    if (note.public) {
      toast({
        description: "You can't delete public notes",
      });
      return;
    }

    try {
      if (note.id && sessionId) {
        await supabase.rpc("delete_note", {
          uuid_arg: note.id,
          session_arg: sessionId,
        });

        toast({
          description: "Note deleted",
        });

        await refreshSessionNotes();
        router.push("/notes");
        router.refresh();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  }, [note, sessionId, supabase, router, refreshSessionNotes]);

  const handleNewNote = useCallback(() => {
    if (addNewPinnedNote && setSelectedNoteSlug) {
      createNote(
        sessionId,
        router,
        addNewPinnedNote,
        refreshSessionNotes,
        setSelectedNoteSlug,
        isMobile || false
      );
    } else {
      router.push("/notes");
    }
  }, [sessionId, router, addNewPinnedNote, refreshSessionNotes, setSelectedNoteSlug, isMobile]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader note={note} saveNote={saveNote} canEdit={canEdit} />
      <NoteContent
        note={note}
        saveNote={saveNote}
        canEdit={canEdit}
        onDelete={handleDelete}
        onNewNote={handleNewNote}
      />
    </div>
  );
}