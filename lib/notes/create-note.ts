import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Note } from "@/lib/notes/types";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean,
  isDesktop: boolean = false,
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

    if (isDesktop) {
      // In desktop mode, use callbacks instead of router
      addNewPinnedNote(slug);
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
    } else if (!isMobile) {
      addNewPinnedNote(slug);
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/notes/${slug}`);
        router.refresh();
      });
    } else {
      // On mobile, update localStorage directly without triggering React state.
      // This prevents the note from flashing in the sidebar before navigation.
      // The sidebar will read the updated pinnedNotes from localStorage when it remounts.
      const storedPinnedNotes = localStorage.getItem("pinnedNotes");
      const pinnedNotes = storedPinnedNotes ? JSON.parse(storedPinnedNotes) : [];
      if (!pinnedNotes.includes(slug)) {
        pinnedNotes.push(slug);
        localStorage.setItem("pinnedNotes", JSON.stringify(pinnedNotes));
      }
      router.push(`/notes/${slug}`);
    }

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
  }
}
