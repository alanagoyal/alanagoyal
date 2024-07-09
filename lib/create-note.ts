import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";

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
    await supabase.from("notes").upsert(note, { onConflict: "id" });

    addNewPinnedNote(slug);

    router.push(`/${slug}`);
    router.refresh();

    refreshSessionNotes();
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
