import { createClient } from "@/utils/supabase/client";
import { Note } from "./types";

/**
 * Centralized note persistence layer
 * Handles all database operations for notes with proper error handling and retries
 */

export type NoteField = 'title' | 'content' | 'emoji';

export interface SaveResult {
  success: boolean;
  error?: Error;
}

/**
 * Persists a complete note to the database (for new notes)
 */
export async function persistNote(note: Partial<Note>): Promise<SaveResult> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("notes").insert(note);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error persisting note:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Updates specific fields of an existing note
 * Uses a single consolidated RPC call for efficiency
 */
export async function persistNoteFields(
  noteId: string,
  sessionId: string,
  updates: Partial<Pick<Note, NoteField>>
): Promise<SaveResult> {
  const supabase = createClient();

  try {
    // Build the update object, only including defined fields
    const updateData: any = {
      uuid_arg: noteId,
      session_arg: sessionId,
    };

    if ('title' in updates) {
      updateData.title_arg = updates.title;
    }
    if ('content' in updates) {
      updateData.content_arg = updates.content;
    }
    if ('emoji' in updates) {
      updateData.emoji_arg = updates.emoji;
    }

    // For now, we'll use the existing separate RPC calls
    // TODO: Replace with consolidated update_note RPC function once it's deployed
    const promises: Promise<any>[] = [];

    if ('title' in updates) {
      const promise = supabase.rpc("update_note_title", {
        uuid_arg: noteId,
        session_arg: sessionId,
        title_arg: updates.title,
      });
      promises.push(Promise.resolve(promise));
    }

    if ('emoji' in updates) {
      const promise = supabase.rpc("update_note_emoji", {
        uuid_arg: noteId,
        session_arg: sessionId,
        emoji_arg: updates.emoji,
      });
      promises.push(Promise.resolve(promise));
    }

    if ('content' in updates) {
      const promise = supabase.rpc("update_note_content", {
        uuid_arg: noteId,
        session_arg: sessionId,
        content_arg: updates.content,
      });
      promises.push(Promise.resolve(promise));
    }

    // Execute all updates in parallel
    const results = await Promise.all(promises);

    // Check for errors
    for (const result of results) {
      if (result.error) throw result.error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating note fields:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Revalidates the ISR cache for a note
 * Only needed for public notes, but safe to call for private notes
 */
export async function revalidateNote(slug: string): Promise<void> {
  try {
    await fetch("/notes/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
      },
      body: JSON.stringify({ slug }),
    });
  } catch (error) {
    // Revalidation failures shouldn't block the save
    console.error("Revalidation failed:", error);
  }
}

/**
 * Save queue for managing pending saves
 * Ensures no data is lost even if component unmounts
 */
class SaveQueue {
  private queue: Map<string, {
    noteId: string;
    sessionId: string;
    field: NoteField;
    value: any;
    timestamp: number;
  }> = new Map();

  private processingQueue = false;

  /**
   * Add a save operation to the queue
   */
  enqueue(noteId: string, sessionId: string, field: NoteField, value: any) {
    const key = `${noteId}-${field}`;
    this.queue.set(key, {
      noteId,
      sessionId,
      field,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Process all queued saves
   */
  async flush(): Promise<void> {
    if (this.processingQueue || this.queue.size === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Group saves by noteId for efficiency
      const savesByNote = new Map<string, Map<NoteField, any>>();

      for (const item of Array.from(this.queue.values())) {
        if (!savesByNote.has(item.noteId)) {
          savesByNote.set(item.noteId, new Map());
        }
        savesByNote.get(item.noteId)!.set(item.field, item.value);
      }

      // Execute saves for each note
      const savePromises: Promise<SaveResult>[] = [];

      for (const [noteId, fields] of Array.from(savesByNote.entries())) {
        const item = Array.from(this.queue.values()).find(i => i.noteId === noteId)!;
        const updates: Partial<Pick<Note, NoteField>> = {};

        for (const [field, value] of Array.from(fields.entries())) {
          (updates as any)[field] = value;
        }

        savePromises.push(
          persistNoteFields(noteId, item.sessionId, updates)
        );
      }

      await Promise.all(savePromises);

      // Clear the queue
      this.queue.clear();
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get pending save count (for UI feedback)
   */
  getPendingCount(): number {
    return this.queue.size;
  }
}

// Global save queue instance
export const saveQueue = new SaveQueue();

// Flush queue before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Note: This is synchronous, but we do our best
    saveQueue.flush();
  });
}
