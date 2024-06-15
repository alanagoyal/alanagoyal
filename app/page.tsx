import Note from "@/components/note";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const note = {
    id: uuidv4(),
    title: 'welcome!',
    content: 'welcome to my notes',
    created_at: new Date().toISOString(),
    emoji: '👋🏼',
    public: true
  };

  return (
    <div className="w-full min-h-screen p-5">
      <Note note={note} />
    </div>
  );
}
