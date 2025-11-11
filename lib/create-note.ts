import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean,
  addOptimisticNote?: (note: any) => void,
  removeOptimisticNote?: (slug: string) => void
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
    // Step 1: Add note optimistically to UI immediately
    if (addOptimisticNote) {
      addOptimisticNote(note);
    }

    addNewPinnedNote(slug);
    setSelectedNoteSlug(slug);

    // Step 2: Insert into database BEFORE navigating
    const { error } = await supabase.from("notes").insert(note);

    if (error) {
      // If insert fails, remove optimistic note and show error
      if (removeOptimisticNote) {
        removeOptimisticNote(slug);
      }
      throw error;
    }

    // Step 3: Now that DB insert succeeded, navigate to the note
    router.push(`/notes/${slug}`);

    // Step 4: Refresh to sync with server and clear optimistic state
    await refreshSessionNotes();

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
    toast({
      description: "Failed to create note",
      variant: "destructive",
    });
  }
}
