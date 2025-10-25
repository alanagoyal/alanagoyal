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

  if (isMobile) {
    // Mobile: Navigate FIRST to trigger route change and hide sidebar
    setSelectedNoteSlug(slug);
    router.push(`/notes/${slug}`);

    // Defer adding to context until next frame
    // This ensures the navigation starts and sidebar hides before the note appears in it
    requestAnimationFrame(() => {
      addNoteToContext(note);
      addNewPinnedNote(slug);
    });
  } else {
    // Desktop: Add to context immediately so sidebar and note view update simultaneously
    // Both are visible, so we want them to appear at the same time
    addNoteToContext(note);
    addNewPinnedNote(slug);
    setSelectedNoteSlug(slug);
    router.push(`/notes/${slug}`);
  }

  // Database insert happens in background (fire and forget)
  supabase.from("notes").insert(note).then(({ error }) => {
    if (error) {
      console.error("Error creating note:", error);
      toast({
        description: "Error creating note",
        variant: "destructive",
      });
    } else {
      toast({
        description: "Private note created",
      });
    }
  });
}
