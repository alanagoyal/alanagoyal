import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => void,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean,
  addOptimisticNote?: (note: any) => void
) {
  const supabase = createClient();
  const noteId = uuidv4();
  const slug = `new-note-${noteId}`;

  const note = {
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

  try {
    // Add the note optimistically to the UI immediately
    if (addOptimisticNote) {
      addOptimisticNote(note);
    }

    addNewPinnedNote(slug);
    setSelectedNoteSlug(slug);

    // Navigate to the new note page immediately
    router.push(`/notes/${slug}`);

    // Insert the note in the database
    const { error } = await supabase.from("notes").insert(note);

    if (error) throw error;

    // Refresh to sync with the server (this will clear optimistic notes)
    refreshSessionNotes();

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
    // If there's an error, still try to refresh to clear optimistic state
    refreshSessionNotes();
  }
}
