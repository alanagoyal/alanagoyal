import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";

export default async function NotePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const title = params.id;
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
