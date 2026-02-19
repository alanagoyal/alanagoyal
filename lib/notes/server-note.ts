import { cache } from "react";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";

export const getNoteBySlug = cache(async (slug: string): Promise<NoteType | null> => {
  const supabase = await createServerClient();
  const { data: note } = (await supabase
    .rpc("select_note", {
      note_slug_arg: slug,
    })
    .single()) as { data: NoteType | null };
  return note;
});

export async function getPublicNoteSlugs(): Promise<string[]> {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return (posts ?? []).map(({ slug }) => slug);
}
