import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Note } from "@/lib/notes/types";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string, silent?: boolean) => void,
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean,
  useCallbackNavigation: boolean = false,
  onNoteCreated?: (note: Note) => void
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

    if (useCallbackNavigation) {
      // Use callbacks instead of router navigation
      addNewPinnedNote(slug, true);
      await refreshSessionNotes();
      setSelectedNoteSlug(slug);
      // Fetch the full note and call the callback
      if (onNoteCreated) {
        const { data: fullNote } = await supabase
          .rpc("select_note", { note_slug_arg: slug })
          .single();
        if (fullNote) {
          onNoteCreated(fullNote as Note);
        }
      }
    } else {
      // Use router navigation (standalone browser mode)
      addNewPinnedNote(slug, true);
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/notes/${slug}`);
        router.refresh();
      });
    }

    if (!isMobile) {
      toast({
        description: "Private note created",
      });
    }
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
