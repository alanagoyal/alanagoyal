import Note from "@/components/note";
import { createClient } from "@supabase/supabase-js";


export async function generateStaticParams() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: notes } = await supabase.from("notes").select("slug");
  
  return notes?.map((note) => ({
    slug: note.slug,
  })) || [];
}

export default async function NotePage({ params }: { params: { slug: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const slug = params.slug;
  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("slug", slug)
    .single();
  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note} />
    </div>
  );
}
