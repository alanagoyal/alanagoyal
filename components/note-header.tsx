import { format, parseISO } from 'date-fns';
import NewNote from "./new-note";

export default function NoteHeader({ note }: {note: any}) {
  const formattedDate = format(parseISO(note.created_at), 'MMMM d, yyyy \'at\' h:mma');
  return (
    <div className="bg-[#1e1e1e] pb-4 mb-4">
      <p className="text-center text-muted-foreground text-xs">{formattedDate}</p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{note.title}</p>
        <NewNote/>
      </div>
    </div>
  );
}
