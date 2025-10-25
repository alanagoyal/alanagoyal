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

  // Add note to context immediately so it's available for rendering
  addNoteToContext(note);
  addNewPinnedNote(slug);
  setSelectedNoteSlug(slug);

  // Navigate immediately - on mobile this hides the sidebar, on desktop both update together
  router.push(`/notes/${slug}`);

  // Insert to database in background
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
