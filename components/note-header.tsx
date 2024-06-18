import { format, parseISO } from "date-fns";

export default function NoteHeader({ note }: { note: any }) {
  const formattedDate = format(
    parseISO(note.created_at),
    "MMMM d, yyyy 'at' h:mm a"
  );
  return (
    <div className="bg-[#1e1e1e] mb-4">
      <p className="text-center text-muted-foreground text-xs">
        {formattedDate}
      </p>
      <p className="text-lg font-bold">{note.emoji} {note.title}</p>
    </div>
  );
}
