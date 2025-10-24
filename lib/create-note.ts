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
  addNoteToContext: (note: any) => void
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

    // Optimistically add note to sidebar context immediately
    // This ensures note appears in sidebar without waiting for database refetch
    addNoteToContext(note);

    addNewPinnedNote(slug);

    if (!isMobile) {
      // Desktop: navigate immediately
      setSelectedNoteSlug(slug);
      router.push(`/notes/${slug}`);
      router.refresh(); // Ensure server component fetches fresh data
    } else {
      // Mobile: navigate to note, then refresh to ensure server has latest data
      router.push(`/notes/${slug}`).then(() => {
        setSelectedNoteSlug(slug);
        router.refresh(); // Ensure server component fetches the note from DB
      });
    }

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
