import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => void,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean
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
    const { error } = await supabase.from("notes").insert(note);

    if (error) throw error;

    addNewPinnedNote(slug);
    setSelectedNoteSlug(slug);

    // Navigate to the new note
    if (!isMobile) {
      router.push(`/notes/${slug}`);
    } else {
      await router.push(`/notes/${slug}`);
    }

    // Refresh to get the new note from the server
    refreshSessionNotes();

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
