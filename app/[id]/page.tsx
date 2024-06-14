import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";

export default async function NotePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  // Replace hyphens with spaces to match the title format in the database
  const title = params.id.replace(/-/g, ' ');
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("title", title)
    .single();
  return (
    <div className="w-full min-h-screen p-5">
      <Note note={data} />
    </div>
  );
}
