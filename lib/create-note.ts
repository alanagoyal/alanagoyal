import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { Note } from "./types";
import { persistNote } from "./note-persistence";

/**
 * Creates a new note with optimistic UI updates
 * The note appears instantly in the UI while being persisted to the database in the background
 */
export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  addOptimisticNote: (note: Note) => void,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean
) {
  if (!sessionId) {
    toast({
      description: "Session not initialized",
      variant: "destructive",
    });
    return;
  }

  const noteId = uuidv4();
  const slug = `new-note-${noteId}`;

  // Create the note object with all required fields
  const note: Note = {
    id: noteId,
    slug: slug,
    title: "",
    content: "",
    public: false,
    created_at: new Date().toISOString(),
    session_id: sessionId,
    category: "today",
    emoji: "👋🏼",
  };

  // 1. Add to context immediately (optimistic update)
  // This makes the note appear in the sidebar instantly
  addOptimisticNote(note);

  // 2. Add to pinned notes in localStorage
  addNewPinnedNote(slug);

  // 3. Set as selected note
  setSelectedNoteSlug(slug);

  // 4. Navigate immediately - no waiting for database!
  // This makes the UI feel instant and responsive
  router.push(`/notes/${slug}`);

  // 5. Persist to database in the background
  // If this fails, we'll show an error but the UI stays responsive
  persistNote(note)
    .then((result) => {
      if (result.success) {
        toast({
          description: "Private note created",
        });
      } else {
        console.error("Error persisting note:", result.error);
        toast({
          description: "Failed to save note. Please try again.",
          variant: "destructive",
        });
        // TODO: Add retry logic or save to local queue
      }
    })
    .catch((error) => {
      console.error("Error creating note:", error);
      toast({
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    });
}
