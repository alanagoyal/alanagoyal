import Note from "@/components/note";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { notFound } from 'next/navigation';

export const dynamic = "error";

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

  if (!note) {
    // If the note doesn't exist, check if it's a new note
    if (slug.startsWith("new-note-")) {
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
          <Note note={newNote} />
        </div>
      );
    }
    // If it's not a new note and doesn't exist, return 404
    notFound();
  }

  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note} />
    </div>
  );
}