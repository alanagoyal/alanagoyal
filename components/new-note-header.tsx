"use client";

import { format, parseISO } from 'date-fns';
import NewNote from "./new-note";
import { Input } from './ui/input';

export default function NewNoteHeader({ note, setTitle }: {note: any, setTitle: (title: string) => void}) {
  const formattedDate = format(parseISO(note.created_at), 'MMMM d, yyyy \'at\' h:mma');

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  return (
    <div className="bg-[#1e1e1e] pb-4 mb-4">
      <div className="flex items-center justify-between">
        <Input 
          type="text" 
          placeholder={note.title} 
          onChange={handleTitleChange} 
          className="text-lg font-bold bg-transparent border-none"
        />
        <NewNote/>
      </div>
      <p className="text-muted-foreground text-sm pt-2">{formattedDate}</p>
    </div>
  );
}
