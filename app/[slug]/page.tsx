import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase.from('notes').select('slug')

  return posts!.map(({ slug }) => ({
    slug,
  }))
}

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
    public: false,
  };

  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note || newNote} />
    </div>
  );
}