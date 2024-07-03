import Note from "@/components/note";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

export const dynamic = 'error';

export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase.from('notes').select('slug')

  return posts!.map(({ slug }) => ({
    slug,
  }))
}

export default async function NotePage({ params }: { params: { slug: string } }) {
  const supabase = createBrowserClient();
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
    public: false,
  };

  // insert this note
  const { error } = await supabase
    .from("notes")
    .insert(newNote)

  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note || newNote} />
    </div>
  );
}