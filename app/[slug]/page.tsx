import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";

export default async function NotePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const slug = params.slug;
  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("slug", slug)
    .single();

  const newNote = {
    id: slug.replace("new-note-", ""),
    slug: slug,
    title: "",
    content: "",
    emoji: "👋🏼",
    category: "today",
    created_at: new Date().toISOString(),
    public: false,
  };

  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note || newNote} />
    </div>
  );
}

