import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Temporary cache for pending notes on mobile
 *
 * On mobile, we need to navigate away from the sidebar before adding the note to context
 * to avoid showing a flash in the sidebar. This cache stores notes temporarily during
 * the navigation transition so the Note component can render them immediately.
 *
 * Notes are automatically cleaned up after being added to context (500ms timeout).
 */
const pendingNotesCache = new Map<string, any>();

/**
 * Maximum time a note can stay in pending cache before being force-cleaned
 * Prevents memory leaks if navigation is interrupted
 */
const PENDING_NOTE_CLEANUP_TIMEOUT = 5000; // 5 seconds

/**
 * Time to wait before adding note to sidebar context on mobile
 * This ensures the navigation animation completes before the note appears in sidebar
 */
const MOBILE_CONTEXT_UPDATE_DELAY = 500; // 500ms

export function getPendingNote(slug: string) {
  return pendingNotesCache.get(slug);
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
    // Mobile flow: Navigate first, update sidebar later
    // This prevents the user from seeing the note flash in the sidebar before navigation

    // Store note in temporary cache for instant access by Note component
    pendingNotesCache.set(slug, note);

    // Pin immediately so it's marked as pinned even before appearing in sidebar
    addNewPinnedNote(slug);

    // Navigate immediately
    router.push(`/notes/${slug}`);

    // Add to context after navigation completes so it appears in sidebar later
    setTimeout(() => {
      addNoteToContext(note);
      pendingNotesCache.delete(slug);
    }, MOBILE_CONTEXT_UPDATE_DELAY);

    // Safety cleanup: Remove from cache after max timeout to prevent memory leaks
    setTimeout(() => {
      if (pendingNotesCache.has(slug)) {
        console.warn(`Pending note ${slug} was not cleaned up, forcing removal`);
        pendingNotesCache.delete(slug);
      }
    }, PENDING_NOTE_CLEANUP_TIMEOUT);
  } else {
    // Desktop flow: Update sidebar and note view simultaneously
    // Both are visible, so we want them to appear at the exact same time
    addNoteToContext(note);
    addNewPinnedNote(slug);
    router.push(`/notes/${slug}`);
  }

  // Database insert happens in background (non-blocking)
  // Note: If this fails, the note will still appear in UI but won't be persisted
  supabase.from("notes").insert(note).then(({ error }) => {
    if (error) {
      console.error("Error creating note:", error);
      toast({
        description: "Error creating note",
        variant: "destructive",
      });
      // TODO: Consider removing note from context on error
    } else {
      toast({
        description: "Private note created",
      });
    }
  });
}
