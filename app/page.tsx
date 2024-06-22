import Note from "@/components/note";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const { data: note } = await supabase.from('notes').select('*').eq('id', '1d3b70d6-ce1b-4d66-9936-4f5fd38c43aa').single();
  return (
    <div className="w-full min-h-screen p-5">
      <Note note={note} />
    </div>
  );
}
