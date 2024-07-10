import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => void
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
    const { error } = await supabase
      .from('notes')
      .insert(note);

    if (error) throw error;
    
    refreshSessionNotes();
    addNewPinnedNote(slug);

    router.push(`/${slug}`);
    router.refresh();



    toast({
      title: "Note created",
      description: "Your note is private to you in this session",
    });

  } catch (error) {
    console.error("Error creating note:", error);
  }
}
