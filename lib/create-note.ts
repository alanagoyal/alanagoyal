import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => Promise<void>,
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

    if (!isMobile) {
      addNewPinnedNote(slug);
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/notes/${slug}`);
        router.refresh();
      });
    } else {
      // Navigate first, then update sidebar state after navigation
      // to prevent the note from flashing in the sidebar
      setSelectedNoteSlug(slug);
      router.push(`/notes/${slug}`);
      setTimeout(() => {
        addNewPinnedNote(slug);
        refreshSessionNotes();
      }, 100);
    }

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
