import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
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
