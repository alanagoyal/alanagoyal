import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Temporary cache for pending notes (for instant mobile navigation)
const pendingNotesCache = new Map<string, any>();

export function getPendingNote(slug: string) {
  return pendingNotesCache.get(slug);
}

export function clearPendingNote(slug: string) {
  pendingNotesCache.delete(slug);
}

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

  setSelectedNoteSlug(slug);

  if (isMobile) {
    // Mobile: Store note in temporary cache for instant access
    // Navigate immediately without updating context (avoids sidebar flash)
    pendingNotesCache.set(slug, note);
    router.push(`/notes/${slug}`);

    // Add to context after navigation completes so it appears in sidebar later
    setTimeout(() => {
      addNoteToContext(note);
      addNewPinnedNote(slug);
      pendingNotesCache.delete(slug);
    }, 500);
  } else {
    // Desktop: Add to context immediately so both sidebar and note view update together
    addNoteToContext(note);
    addNewPinnedNote(slug);
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
