import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";

export async function createNote(
  sessionId: string | null,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
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
      resolve(slug);
    } catch (error) {
      console.error("Error creating note:", error);
      reject(error);
    }
  });
}