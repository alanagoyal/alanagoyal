import { v4 as uuidv4 } from 'uuid';
import Note from "@/components/note";

export default function New() {
  const note = {
    id: uuidv4(),
    title: 'new note',
    content: '',
    created_at: new Date().toISOString(),
    emoji: '👋🏼'
  };

  return (
    <div className="w-full min-h-screen p-5">
      <Note note={note} />
    </div>
  );
}
